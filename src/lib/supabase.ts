// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

// Provide safe fallbacks for local/dev/test and Cypress environments
const resolveEnv = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (url && key) return { url, key };

  // Fallbacks for test/e2e to avoid hard crashes and allow request stubbing
  const isCypress = typeof window !== 'undefined' && (window as any).Cypress;
  if (isCypress || import.meta.env.MODE === 'test' || import.meta.env.DEV) {
    console.warn('Using fallback Supabase credentials for test/dev environment.');
    return {
      url: 'https://stub.supabase.co',
      key: 'public-anon-key',
    };
  }

  // As a last resort, still prevent runtime crash with explicit message
  console.warn('Supabase env vars missing; using fallback values. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for production.');
  return {
    url: 'https://stub.supabase.co',
    key: 'public-anon-key',
  };
};

const { url: supabaseUrl, key: supabaseAnonKey } = resolveEnv();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to check connection
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('datasets').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
};

// Initialize Supabase - called automatically on import
export const initializeSupabase = () => {
  console.log('Supabase client initialized');
  return supabase;
};

// Check Supabase health
export const checkSupabaseHealth = async () => {
  return await checkSupabaseConnection();
};

// Handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', JSON.stringify(error, null, 2));
  if (error?.message) {
    return error.message;
  }
  return 'An unknown database error occurred';
};