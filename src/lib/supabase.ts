// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are missing
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey
  });
}

// Create a fallback client that throws errors when used
const createFallbackClient = () => {
  return {
    auth: {
      signIn: () => { throw new Error('Supabase not configured'); },
      signOut: () => { throw new Error('Supabase not configured'); },
      getUser: () => { throw new Error('Supabase not configured'); },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({ select: () => { throw new Error('Supabase not configured'); } }),
    storage: {
      from: () => ({ upload: () => { throw new Error('Supabase not configured'); } })
    }
  } as any;
};

// Only create the client if environment variables are available
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}) : createFallbackClient();

// Helper function to check connection
export const checkSupabaseConnection = async () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - skipping connection check');
    return false;
  }

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
  if (isSupabaseConfigured) {
    console.log('Supabase client initialized');
    
    // Expose to window for debugging/console access (dev only)
    if (import.meta.env.DEV) {
      (window as any).supabase = supabase;
      console.log('💡 Debug: window.supabase is now available in console');
    }
  } else {
    console.warn('Supabase not configured - using fallback client');
  }
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