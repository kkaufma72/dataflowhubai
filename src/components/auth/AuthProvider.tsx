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

  // Memoized function to clear local data
  const clearLocalData = useCallback(async () => {
    console.log('🧹 Clearing local data...');
    localStorage.clear();
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
  }, []);

  // Memoized function to handle auth errors
  const handleAuthError = useCallback(async (error: any) => {
    console.log('🔴 Handling auth error:', error);
    if (error?.message?.includes('refresh_token_not_found') || 
        error?.message?.includes('Invalid Refresh Token')) {
      await clearLocalData();
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    }
  }, [clearLocalData]);

  useEffect(() => {
    console.log('🚀 AuthProvider mounting...');
    let mounted = true;

    // Check active sessions and set the user (avoid supabase.auth.getSession() as it hangs)
    const initializeAuth = async () => {
      try {
        console.log('📡 Getting session from localStorage...');
        
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
              console.log('✅ Session found in localStorage:', session.user?.email);
            }
          } catch (e) {
            console.warn('Could not parse session from localStorage');
          }
        }
        
        if (!mounted) {
          console.log('⚠️ Component unmounted, skipping session update');
          return;
        }
        
        setSession(session as any);
        setUser(session?.user ?? null);
        setLoading(false);
        isInitialMount.current = false;
      } catch (error) {
        console.error('❌ Error getting session:', error);
        if (mounted) {
          await handleAuthError(error);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for changes on auth state
    console.log('👂 Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {
        console.log('⚠️ Component unmounted, skipping auth state change');
        return;
      }

      // Skip INITIAL_SESSION and duplicate SIGNED_IN events after initial mount
      if (!isInitialMount.current && event === 'INITIAL_SESSION') {
        console.log('⏭️ Skipping INITIAL_SESSION - already initialized');
        return;
      }

      // Skip duplicate SIGNED_IN events if user is already set
      if (event === 'SIGNED_IN' && user?.id === session?.user?.id) {
        console.log('⏭️ Skipping duplicate SIGNED_IN event for same user');
        return;
      }

      console.log('🔄 Auth state change:', event, !!session);
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        await clearLocalData();
        setUser(null);
        setSession(null);
        setLoading(false);
        // Dispatch custom event for UserContext
        window.dispatchEvent(new CustomEvent('auth-signed-out'));
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Dispatch custom event for UserContext
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      } else if (event === 'SIGNED_IN') {
        console.log('✅ User signed in:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Dispatch custom event for UserContext
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
        
        // For OAuth sign-ins, create user profile if it doesn't exist
        if (session?.user) {
          try {
            console.log('👤 Checking user profile...');
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (profileError) {
              console.error('❌ Error checking profile:', profileError);
            }
            
            if (!profile) {
              console.log('📝 Creating user profile...');
              const { error: insertError } = await supabase.from('user_profiles').insert([{
                user_id: session.user.id,
                full_name: session.user.user_metadata.full_name || 
                          session.user.user_metadata.name || 
                          session.user.email?.split('@')[0] || 'User',
                avatar_url: session.user.user_metadata.avatar_url || null,
                email: session.user.email
              }]);
              
              if (insertError) {
                console.error('❌ Error creating profile:', insertError);
              } else {
                console.log('✅ User profile created');
              }
            } else {
              console.log('✅ User profile exists');
            }
          } catch (error) {
            console.error('❌ Error in profile creation:', error);
          }
        }
      } else if (event === 'INITIAL_SESSION') {
        console.log('🎬 Initial session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        isInitialMount.current = false;
      } else {
        console.log('📝 Other auth event:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      console.log('🧹 AuthProvider unmounting...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthError, clearLocalData, user?.id]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔐 Signing in with email:', email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('❌ Sign in error:', error);
        return { error };
      }
      console.log('✅ Sign in successful');
      return { error: null };
    } catch (error) {
      console.error('❌ Error signing in:', error);
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
      if (error) {
        console.error('❌ Sign up error:', error);
      } else {
        console.log('✅ Sign up successful');
      }
      return { error, user: data?.user || null };
    } catch (error) {
      console.error('❌ Error signing up:', error);
      return { error: error as Error, user: null };
    }
  }, []);

  // Sign in with OAuth provider
  const signInWithOAuth = useCallback(async (provider: Provider) => {
    try {
      console.log('🔗 Signing in with OAuth provider:', provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/app`,
          scopes: provider === 'github' ? 'read:user user:email' : undefined,
        }
      });
      
      if (error) {
        console.error('❌ OAuth sign in error:', error);
        return { error };
      }
      console.log('✅ OAuth redirect initiated');
      return { error: null };
    } catch (error) {
      console.error('❌ Error signing in with OAuth:', error);
      return { error: error as Error };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      console.log('👋 Signing out...');
      await clearLocalData();
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  }, [clearLocalData]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      console.log('🔑 Resetting password for:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset#recovery`
      });
      if (error) {
        console.error('❌ Reset password error:', error);
      } else {
        console.log('✅ Password reset email sent');
      }
      return { error };
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      return { error: error as Error };
    }
  }, []);

  console.log('🎨 AuthProvider rendering - Loading:', loading, 'User:', !!user);

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