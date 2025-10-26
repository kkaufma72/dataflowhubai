// Helper functions for Supabase operations using direct fetch
// (to avoid the hanging Supabase client issue)

import { supabase } from './supabase';

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
        console.log('🔑 Using cached auth token from localStorage');
        return parsedAuth.access_token;
      }
    } catch (e) {
      console.warn('Could not parse cached auth token');
    }
  }
  
  console.log('🔑 No cached token, using anon key');
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

