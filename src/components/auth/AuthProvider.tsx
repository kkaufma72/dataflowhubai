import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, Session, Provider } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<{ error: Error | null, user: User | null }>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, user: null }),
  signInWithOAuth: async () => ({ error: null }),
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
  const isInitialMount = useRef(true);
  const isSigningOut = useRef(false);
  const isInitialized = useRef(false); // Prevent multiple initializations

  // Memoized function to clear local data
  const clearLocalData = useCallback(async () => {
    localStorage.clear();
    try {
      const databases = await window.indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });
    } catch (error) {
      // Silent fail
    }
  }, []);

  // Memoized function to handle auth errors
  const handleAuthError = useCallback(async (error: any) => {
    if (error?.message?.includes('refresh_token_not_found') || 
        error?.message?.includes('Invalid Refresh Token')) {
      await clearLocalData();
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    }
  }, [clearLocalData]);

  useEffect(() => {
    // Skip if already initialized (prevents double-initialization in StrictMode)
    if (isInitialized.current) {
      return; // Silent skip for better performance
    }
    
    isInitialized.current = true;
    let mounted = true;

    // Check active sessions and set the user (avoid supabase.auth.getSession() as it hangs)
    const initializeAuth = async () => {
      try {
        // Try to get session from localStorage first (Supabase stores it there)
        const authData = localStorage.getItem('sb-bcobpxgktvgfsffdsiog-auth-token');
        let session = null;
        
        if (authData) {
          try {
            const parsedAuth = JSON.parse(authData);
            // Create a session-like object from localStorage data
            if (parsedAuth?.user && parsedAuth?.access_token) {
              session = {
                user: parsedAuth.user,
                access_token: parsedAuth.access_token,
                refresh_token: parsedAuth.refresh_token
              };
            }
          } catch (e) {
            // Silent fail, session will be null
          }
        }
        
        if (!mounted) {
          return;
        }
        
        setSession(session as any);
        setUser(session?.user ?? null);
        setLoading(false);
        isInitialMount.current = false;
      } catch (error) {
        if (mounted) {
          await handleAuthError(error);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      if (!mounted) return;

      // Skip INITIAL_SESSION and duplicate SIGNED_IN events after initial mount
      if (!isInitialMount.current && event === 'INITIAL_SESSION') {
        return;
      }

      // Skip duplicate SIGNED_IN events if user is already set
      if (event === 'SIGNED_IN' && user?.id === session?.user?.id) {
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        // Only clear data if not already signing out (to prevent loops)
        if (!isSigningOut.current) {
          await clearLocalData();
        }
        setUser(null);
        setSession(null);
        setLoading(false);
        // Dispatch custom event for UserContext
        window.dispatchEvent(new CustomEvent('auth-signed-out'));
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Dispatch custom event for UserContext
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      } else if (event === 'SIGNED_IN') {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Dispatch custom event for UserContext
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
        
        // For OAuth sign-ins, create user profile if it doesn't exist
        if (session?.user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (!profile && !profileError) {
              await supabase.from('user_profiles').insert([{
                user_id: session.user.id,
                full_name: session.user.user_metadata.full_name || 
                          session.user.user_metadata.name || 
                          session.user.email?.split('@')[0] || 'User',
                avatar_url: session.user.user_metadata.avatar_url || null,
                email: session.user.email
              }]);
            }
          } catch (error) {
            // Silent fail on profile creation
          }
        }
      } else if (event === 'INITIAL_SESSION') {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        isInitialMount.current = false;
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthError, clearLocalData, user?.id]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      console.log('📝 Signing up with email:', email);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: metadata
        }
      });
      return { error, user: data?.user || null };
    } catch (error) {
      return { error: error as Error, user: null };
    }
  }, []);

  // Sign in with OAuth provider
  const signInWithOAuth = useCallback(async (provider: Provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/app/auth/callback`,
          scopes: provider === 'github' ? 'read:user user:email' : undefined,
        }
      });
      
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    // Prevent multiple simultaneous sign-outs
    if (isSigningOut.current) {
      return;
    }
    
    try {
      isSigningOut.current = true;
      
      // Sign out from Supabase first
      await supabase.auth.signOut();
      
      // Then clear local data
      await clearLocalData();
      
      // Update state
      setUser(null);
      setSession(null);
      
    } catch (error) {
      // Silent fail
    } finally {
      // Reset flag after a short delay to allow redirect
      setTimeout(() => {
        isSigningOut.current = false;
      }, 1000);
    }
  }, [clearLocalData]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset#recovery`
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      loading, 
      signIn, 
      signUp,
      signInWithOAuth,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};