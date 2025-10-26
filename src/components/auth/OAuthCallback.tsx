import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔄 Handling OAuth callback...');
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          navigate('/signin?error=oauth_failed');
          return;
        }

        if (session) {
          console.log('✅ OAuth session established:', session.user.email);
          // Redirect to app dashboard
          navigate('/app', { replace: true });
        } else {
          console.log('⚠️ No session found');
          navigate('/signin?error=no_session');
        }
      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        navigate('/signin?error=oauth_error');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  );
};

export default OAuthCallback;

