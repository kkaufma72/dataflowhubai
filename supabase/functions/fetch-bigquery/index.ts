import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const encoder = new TextEncoder();

const base64UrlEncode = (input: string | Uint8Array): string => {
  const buffer = typeof input === 'string' ? encoder.encode(input) : input;
  let binary = '';
  buffer.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const base64 = btoa(binary);
  return base64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const pemToArrayBuffer = (pem: string): ArrayBuffer => {
  const normalized = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const getAccessToken = async () => {
  const clientEmail = Deno.env.get('GCP_BIGQUERY_CLIENT_EMAIL');
  const rawPrivateKey = Deno.env.get('GCP_BIGQUERY_PRIVATE_KEY');
  if (!clientEmail || !rawPrivateKey) {
    throw new Error('Missing GCP BigQuery service account credentials.');
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/bigquery.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsignedJwt = `${header}.${payload}`;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedJwt),
  );
  const signature = base64UrlEncode(new Uint8Array(signatureBuffer));
  const assertion = `${unsignedJwt}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to obtain Google access token: ${errorText}`);
  }

  const tokenJson = await tokenResponse.json();
  return tokenJson.access_token as string;
};

const sanitizeTablePath = (path: string): string => {
  const parts = path.split('.');
  if (parts.length !== 3) {
    throw new Error('Dataset Location must be in the format project.dataset.table');
  }

  const isValid = parts.every((segment) => /^[a-zA-Z0-9_\-]+$/.test(segment));
  if (!isValid) {
    throw new Error('Dataset Location contains invalid characters.');
  }

  return parts.join('.');
};

const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return JSON.stringify(value.map((item) => formatCellValue(item)));
    }
    if ('f' in value && Array.isArray(value.f)) {
      return JSON.stringify(value.f.map((field: any) => formatCellValue(field.v)));
    }
    if ('v' in value) {
      return formatCellValue(value.v);
    }
    return JSON.stringify(value);
  }
  return String(value);
};

const transformRows = (schema: { fields: { name: string }[] }, rows: any[] = []) => {
  const columns = schema.fields.map((field) => field.name);
  const formattedRows = rows.map((row) =>
    row.f.map((cell: { v: any }) => formatCellValue(cell.v))
  );
  return { columns, rows: formattedRows };
};

const fetchQueryResults = async (
  accessToken: string,
  projectId: string,
  tablePath: string,
  maxRows: number,
) => {
  const queryBody = {
    query: `SELECT * FROM \`${tablePath}\` LIMIT ${maxRows}`,
    useLegacySql: false,
    timeoutMs: 10000,
    maxResults: maxRows,
  };

  const response = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(queryBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`BigQuery query failed: ${errorText}`);
  }

  const data = await response.json();

  if (data.jobComplete) {
    return data;
  }

  const jobId = data.jobReference?.jobId;
  if (!jobId) {
    throw new Error('BigQuery job did not complete and no jobId was returned.');
  }

  const followUpResponse = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries/${jobId}?maxResults=${maxRows}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!followUpResponse.ok) {
    const errorText = await followUpResponse.text();
    throw new Error(`Failed to fetch BigQuery job results: ${errorText}`);
  }

  return await followUpResponse.json();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const billingProjectId = Deno.env.get('GCP_BIGQUERY_PROJECT_ID');
    if (!billingProjectId) {
      throw new Error('Missing GCP_BIGQUERY_PROJECT_ID environment variable.');
    }

    const { tablePath, maxRows = 200 } = await req.json();
    if (!tablePath) {
      throw new Error('tablePath is required.');
    }

    const sanitizedPath = sanitizeTablePath(tablePath.trim());
    const limitedRows = Math.min(Math.max(Number(maxRows) || 50, 10), 500);

    const accessToken = await getAccessToken();
    const queryResult = await fetchQueryResults(accessToken, billingProjectId, sanitizedPath, limitedRows);

    if (!queryResult.schema) {
      throw new Error('BigQuery response did not include a schema.');
    }

    const { columns, rows } = transformRows(queryResult.schema, queryResult.rows);

    return new Response(
      JSON.stringify({
        columns,
        rows,
        totalRows: Number(queryResult.totalRows ?? rows.length),
        tablePath: sanitizedPath,
        schema: queryResult.schema,
        jobReference: queryResult.jobReference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('BigQuery fetch failed:', error);
    return new Response(
      JSON.stringify({ error: error.message ?? 'Unexpected error occurred.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
