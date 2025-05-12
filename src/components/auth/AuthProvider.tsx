import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<{ error: Error | null, user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, user: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const clearLocalData = async () => {
    // Clear all local storage data
    localStorage.clear();
    
    // Clear IndexedDB data
    try {
      const databases = await window.indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  };

  const handleAuthError = async (error: any) => {
    // Check for refresh token errors
    if (error?.message?.includes('refresh_token_not_found') || 
        error?.message?.includes('Invalid Refresh Token')) {
      await clearLocalData();
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      
      // Redirect to sign in page
      window.location.href = '/signin';
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          handleAuthError(error);
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error getting session:', error);
        handleAuthError(error);
        setLoading(false);
      });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Reduce console logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth state change event:', event);
      }
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        await clearLocalData();
        setUser(null);
        setSession(null);
        window.location.href = '/signin';
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(session);
        setUser(session?.user ?? null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      
      setLoading(false);
    });

    // Error handling for refresh token failures
    const refreshTokenTimer = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          handleAuthError(error);
        } else if (!session) {
          await clearLocalData();
          // Use navigate instead of direct location change for better UX
          navigate('/signin');
        }
      } catch (error) {
        console.error('Error refreshing session:', error);
        handleAuthError(error);
      }
    }, 300000); // Check every 5 minutes instead of every minute to reduce background operations

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshTokenTimer);
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: error as Error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: metadata
        }
      });
      return { error, user: data?.user || null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error: error as Error, user: null };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await clearLocalData();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset#recovery`
      });
      return { error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      loading, 
      signIn, 
      signUp, 
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};