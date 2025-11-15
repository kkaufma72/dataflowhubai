// Helper functions for Supabase operations using direct fetch
// (to avoid the hanging Supabase client issue)

/**
 * Check if token is expired (with 5 minute buffer)
 */
function isTokenExpired(expiresAt: number): boolean {
  if (!expiresAt) return true;
  // Add 5 minute buffer to refresh before actual expiration
  const bufferTime = 5 * 60 * 1000;
  return Date.now() >= (expiresAt * 1000 - bufferTime);
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    if (!response.ok) {
      console.error('❌ Token refresh failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    // Update localStorage with new token
    const authData = localStorage.getItem('sb-bcobpxgktvgfsffdsiog-auth-token');
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        parsedAuth.access_token = data.access_token;
        parsedAuth.expires_at = data.expires_at;
        parsedAuth.refresh_token = data.refresh_token || parsedAuth.refresh_token;
        localStorage.setItem('sb-bcobpxgktvgfsffdsiog-auth-token', JSON.stringify(parsedAuth));
        console.log('✅ Token refreshed successfully');
      } catch (e) {
        console.error('Could not update localStorage with refreshed token');
      }
    }
    
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    return null;
  }
}

/**
 * Get the authenticated user's access token
 * Falls back to anon key if no session is available
 */
export async function getAuthToken(): Promise<string> {
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // ONLY get from localStorage - DO NOT call supabase.auth.getSession() as it hangs
  const authData = localStorage.getItem('sb-bcobpxgktvgfsffdsiog-auth-token');
  if (authData) {
    try {
      const parsedAuth = JSON.parse(authData);
      if (parsedAuth?.access_token) {
        // Check if token is expired
        if (parsedAuth.expires_at && isTokenExpired(parsedAuth.expires_at)) {
          console.log('⏰ Token expired, attempting refresh...');
          if (parsedAuth.refresh_token) {
            const newToken = await refreshAccessToken(parsedAuth.refresh_token);
            if (newToken) {
              return newToken;
            }
          }
          // Token expired, fall back to anon key
        } else {
          // Using cached auth token
          return parsedAuth.access_token;
        }
      }
    } catch (e) {
      // Could not parse cached auth token
    }
  }
  
  // No cached token, using anon key
  return supabaseKey;
}

/**
 * Make a direct fetch request to Supabase REST API
 */
export async function supabaseFetch(
  endpoint: string,
  options: RequestInit & { useAuth?: boolean } = {}
) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const { useAuth = true, ...fetchOptions } = options;
  
  // Get auth token if needed
  const authToken = useAuth ? await getAuthToken() : supabaseKey;
  
  const response = await fetch(`${supabaseUrl}${endpoint}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${authToken}`,
      ...fetchOptions.headers
    }
  });
  
  return response;
}

/**
 * Insert a record into a Supabase table using direct fetch
 */
export async function supabaseInsert<T>(
  table: string,
  data: Record<string, any> | Record<string, any>[]
): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    const response = await supabaseFetch(`/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(Array.isArray(data) ? data : [data])
    });
    
    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      console.log('🔐 Got 401, token may be expired. Attempting to refresh and retry...');
      
      // Try to refresh the token and retry once
      const authData = localStorage.getItem('sb-bcobpxgktvgfsffdsiog-auth-token');
      if (authData) {
        try {
          const parsedAuth = JSON.parse(authData);
          if (parsedAuth?.refresh_token) {
            const newToken = await refreshAccessToken(parsedAuth.refresh_token);
            if (newToken) {
              // Retry the request with the new token
              const retryResponse = await supabaseFetch(`/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(Array.isArray(data) ? data : [data])
              });
              
              if (!retryResponse.ok) {
                const errorText = await retryResponse.text();
                console.error(`❌ Retry insert to ${table} failed:`, retryResponse.status, errorText);
                return {
                  data: null,
                  error: new Error(`Insert failed: ${retryResponse.status} - ${errorText}`)
                };
              }
              
              const insertedData = await retryResponse.json() as T[];
              return { data: insertedData, error: null };
            }
          }
        } catch (e) {
          console.error('Could not refresh token for retry:', e);
        }
      }
      
      const errorText = await response.text();
      console.error(`❌ Insert to ${table} failed with 401 after refresh attempt:`, errorText);
      return {
        data: null,
        error: new Error(`Authentication failed: ${errorText}`)
      };
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Insert to ${table} failed:`, response.status, errorText);
      return {
        data: null,
        error: new Error(`Insert failed: ${response.status} - ${errorText}`)
      };
    }
    
    const insertedData = await response.json() as T[];
    return { data: insertedData, error: null };
  } catch (error) {
    console.error(`❌ Insert to ${table} error:`, error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

