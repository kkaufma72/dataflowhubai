import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (e) {
  throw new Error('Invalid Supabase URL format');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'automl-platform'
    },
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
    }
  }
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

export const initializeSupabase = async () => {
  if (!isOnline()) {
    throw new Error('No internet connection available');
  }

  const maxRetries = 5;
  const baseDelay = 1000; // Start with 1 second delay

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try a simple query to check connection
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          console.warn(`Network error on attempt ${attempt + 1}:`, error.message);
        } else {
          console.warn(`Connection attempt ${attempt + 1} failed:`, error.message);
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff with jitter
        const jitter = Math.random() * 1000;
        const retryDelay = (baseDelay * Math.pow(2, attempt)) + jitter;
        await delay(retryDelay);
        continue;
      }

      console.log('Successfully connected to Supabase');
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error(`Connection attempt ${attempt + 1} timed out`);
      } else {
        console.error(`Connection attempt ${attempt + 1} failed:`, err);
      }
      
      if (attempt === maxRetries - 1) {
        console.error('All connection attempts failed');
        throw new Error('Failed to establish database connection. Please check your internet connection and try again.');
      }
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 1000;
      const retryDelay = (baseDelay * Math.pow(2, attempt)) + jitter;
      await delay(retryDelay);
    }
  }

  return false;
};

export const checkSupabaseHealth = async () => {
  if (!isOnline()) {
    console.warn('Health check failed: No internet connection');
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1)
      .maybeSingle()
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);

    if (error) {
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error.message?.includes('AbortError')) {
        console.warn('Health check failed: Network error -', error.message);
        return false;
      }
      
      if (error.message?.includes('JWT')) {
        console.warn('Health check failed: Authentication error -', error.message);
        return false;
      }

      console.error('Health check failed: Database error -', error);
      return false;
    }

    return true;
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        console.warn('Health check failed: Request timeout');
        return false;
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.warn('Health check failed: Network error -', err.message);
        return false;
      }
      console.error('Health check failed: Unexpected error -', err);
    } else {
      console.error('Health check failed: Unknown error -', err);
    }
    return false;
  }
};

export const handleSupabaseError = (error: unknown) => {
  if (!isOnline()) {
    return 'No internet connection available. Please check your connection and try again.';
  }

  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (error.name === 'AbortError') {
      return 'The connection timed out. Please try again.';
    }
    if (error.message.includes('JWT')) {
      return 'Your session has expired. Please sign in again.';
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again later.';
};