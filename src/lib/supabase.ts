// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

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