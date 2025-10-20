import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import Card from '../components/common/Card';
import { Rocket, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

// Email validation function to prevent fake/test emails
const isValidEmail = (email: string): boolean => {
  // More strict email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Reject common test/fake domains
  const fakeDomains = [
    'test.com', 
    'example.com', 
    'fake.com', 
    'temp.com',
    'test.test',
    'fake.fake',
    'example.org',
    'sample.com',
    'dummy.com',
    'placeholder.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  
  return emailRegex.test(email) && !fakeDomains.includes(domain);
};

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/app';
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Check for email verification success
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      toast.success('Email verified successfully! Please sign in to continue.', {
        duration: 5000,
        icon: '✅'
      });
      // Clean up URL
      window.history.replaceState({}, '', '/signin');
    }
  }, [location.search]);

  // Handle auth state changes and redirection
  useEffect(() => {
    console.log('SignIn component mounted, destination:', from);
    
    // Check if user is already signed in
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('User already has active session, redirecting to:', from);
          setRedirectInProgress(true);
          navigate(from, { replace: true });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    
    checkSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth state change in SignIn:', event);
      
      if (event === 'SIGNED_IN' && !redirectInProgress) {
        console.log('Signed in event detected, redirecting to:', from);
        setRedirectInProgress(true);
        navigate(from, { replace: true });
      }
    });

    return () => {
      console.log('SignIn component unmounting, cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [navigate, from, redirectInProgress]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      toast.error('Please use a valid email address');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password. Please try again or reset your password.');
        }
        if (error.message === 'Email not confirmed') {
          throw new Error('Please verify your email address before signing in. Check your inbox for the verification link.');
        }
        throw error;
      }
      
      // Redirect will happen automatically via the auth state change listener
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      setError('Please fill in all fields');
      return;
    }
    
    // Validate email format and block fake domains
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address. Test emails like test@test.com are not allowed.');
      toast.error('Please use a real email address', {
        duration: 4000,
        icon: '⚠️'
      });
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}/signin?verified=true`
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw error;
      }
      
      toast.success(
        'Sign up successful! Please check your email to verify your account.', 
        {
          duration: 6000,
          icon: '📧'
        }
      );
      setIsSignUp(false); // Switch back to sign in view
      
      // Clear form
      setEmail('');
      setPassword('');
      setFullName('');
    } catch (error: any) {
      console.error('Error signing up:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = () => {
    navigate('/password-reset');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Rocket className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp 
            ? 'Already have an account? ' 
            : 'Don\'t have an account? '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div className={isSignUp ? 'mt-4' : ''}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder="you@example.com"
                />
              </div>
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-500">
                  Please use a real email address - you'll need it to verify your account
                </p>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder={isSignUp ? "At least 8 characters" : "••••••••"}
                />
              </div>
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              )}
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-end mt-2">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div className="mt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              >
                {isLoading 
                  ? 'Processing...' 
                  : isSignUp 
                    ? 'Sign Up' 
                    : 'Sign In'}
              </Button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: `${window.location.origin}/app`
                      }
                    });
                  }}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                  Google
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:contact@dataflowhub.ai" className="text-indigo-600 hover:text-indigo-500">
              contact@dataflowhub.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;