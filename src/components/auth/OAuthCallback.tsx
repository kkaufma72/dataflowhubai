import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader, CheckCircle } from 'lucide-react';
import { POST_AUTH_REDIRECT_KEY } from '../../constants/auth';

const resolvePostAuthDestination = () => {
  if (typeof window === 'undefined') return '/app';
  const stored = window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  if (stored && stored.startsWith('/')) {
    window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    return stored;
  }
  return '/app';
};

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔄 Handling OAuth callback...');
        setStatus('processing');
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const errorDescription = params.get('error_description') || params.get('error');

        if (errorDescription) {
          console.error('❌ OAuth provider returned an error:', errorDescription);
          setStatus('error');
          setTimeout(() => navigate(`/signin?error=${encodeURIComponent(errorDescription)}`), 2000);
          return;
        }

        if (code) {
          console.log('🔑 Exchanging OAuth code for Supabase session...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('❌ Error exchanging code for session:', exchangeError);
            setStatus('error');
            setTimeout(() => navigate('/signin?error=oauth_exchange_failed'), 2000);
            return;
          }

          // Clean code from URL to prevent accidental re-use on refresh
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          console.warn('⚠️ No OAuth code found in callback URL, checking existing session');
        }
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setStatus('error');
          setTimeout(() => navigate('/signin?error=oauth_failed'), 2000);
          return;
        }

        if (session?.user) {
          console.log('✅ OAuth session established:', session.user.email);
          
          // Check if user profile exists, create if not
          try {
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (profileError && profileError.code !== 'PGRST116') {
              console.error('❌ Error checking profile:', profileError);
            }
            
            if (!profile) {
              console.log('📝 Creating user profile for OAuth user...');
              const { error: insertError } = await supabase.from('user_profiles').insert([{
                user_id: session.user.id,
                full_name: session.user.user_metadata.full_name || 
                          session.user.user_metadata.name || 
                          session.user.email?.split('@')[0] || 'User',
                avatar_url: session.user.user_metadata.avatar_url || 
                           session.user.user_metadata.picture || null,
                email: session.user.email,
                use_case: 'general'
              }]);
              
              if (insertError) {
                console.error('❌ Error creating profile:', insertError);
              } else {
                console.log('✅ User profile created for OAuth user');
              }
            }
          } catch (profileErr) {
            console.error('❌ Error in profile creation:', profileErr);
          }
          
          setStatus('success');
          
          // Short delay to show success message, then redirect
          setTimeout(() => {
            const destination = resolvePostAuthDestination();
            navigate(destination, { replace: true });
          }, 1500);
        } else {
          console.log('⚠️ No session found');
          setStatus('error');
          setTimeout(() => navigate('/signin?error=no_session'), 2000);
        }
      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        setStatus('error');
        setTimeout(() => navigate('/signin?error=oauth_error'), 2000);
      }
    };

    handleOAuthCallback();
  }, [navigate, location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing sign in...
            </h2>
            <p className="text-gray-600">Please wait while we set up your account.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Success!
            </h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600">Redirecting back to sign in...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
