
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import Papa from 'https://esm.sh/papaparse@5.4.1';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

// CORS headers for browser security
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Be more specific for production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper to parse CSV content
async function parseCsv(content: string): Promise<{ columns: string[], rows: any[][] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.errors.length) {
          return reject(new Error(results.errors.map(e => e.message).join(', ')));
        }
        const columns = results.meta.fields || [];
        const rows = results.data.map((row: any) => columns.map(col => row[col] ?? ''));
        resolve({ columns, rows });
      },
      error: (error) => reject(error),
    });
  });
}

// Helper to parse JSON content
function parseJson(content: string): { columns: string[], rows: any[][] } {
  const data = JSON.parse(content);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid JSON format: must be a non-empty array of objects.');
  }
  const columns = Object.keys(data[0]);
  const rows = data.map(item => columns.map(col => item[col] ?? ''));
  return { columns, rows };
}

// Helper to parse Excel content
function parseExcel(content: ArrayBuffer): { columns: string[], rows: any[][] } {
  const workbook = XLSX.read(content, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!Array.isArray(json) || json.length < 1) {
    throw new Error('Excel file appears to be empty.');
  }

  const header = json[0] as string[];
  const columns = header.map(h => String(h)); // Ensure columns are strings
  const rows = (json.slice(1) as any[][]).map(rowArray => 
    columns.map((_, index) => rowArray[index] ?? '')
  );

  return { columns, rows };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { project_id, user_id, file_path, file_name, file_type, file_size } = await req.json();

    if (!project_id || !user_id || !file_path || !file_name) {
      return new Response(JSON.stringify({ error: 'Missing required parameters.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('dataset_uploads')
      .download(file_path);

    if (downloadError) throw downloadError;

    const extension = file_name.split('.').pop()?.toLowerCase();
    let parsedData;

    if (extension === 'csv' || extension === 'txt') {
      const fileContent = await fileData.text();
      parsedData = await parseCsv(fileContent);
    } else if (extension === 'json') {
      const fileContent = await fileData.text();
      parsedData = parseJson(fileContent);
    } else if (extension === 'xlsx' || extension === 'xls') {
      const fileContent = await fileData.arrayBuffer();
      parsedData = parseExcel(fileContent);
    } else {
      throw new Error(`Unsupported file type: ${extension}`);
    }

    const { columns, rows } = parsedData;
    if (!columns || columns.length === 0) {
        throw new Error('File is empty or no columns could be parsed.');
    }

    const preview_data = { columns, rows: rows.slice(0, 100) };
    const fileSizeFormatted = file_size < 1024 * 1024
        ? `${(file_size / 1024).toFixed(1)} KB`
        : `${(file_size / (1024 * 1024)).toFixed(1)} MB`;

    const datasetToInsert = {
      name: file_name,
      description: `Uploaded ${extension?.toUpperCase()} file.`,
      file_type: extension,
      file_size: fileSizeFormatted,
      row_count: rows.length,
      column_count: columns.length,
      preview_data,
      project_id,
      user_id,
      storage_path: file_path,
    };

    const { data: newDataset, error: insertError } = await supabaseAdmin
      .from('datasets')
      .insert(datasetToInsert)
      .select()
      .single();

    if (insertError) throw insertError;
    
    // Clean up the uploaded file, no need to keep it in storage
    await supabaseAdmin.storage.from('dataset_uploads').remove([file_path]);

    return new Response(JSON.stringify({ dataset_id: newDataset.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
