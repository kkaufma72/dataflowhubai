import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Github, Eye, EyeOff } from 'lucide-react';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const SignIn: React.FC = () => {
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  
  const from = (location.state as any)?.from?.pathname || '/app/dashboard';

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check for success message from email confirmation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('confirmed') === 'true') {
      toast.success('Email confirmed successfully! Please sign in to continue.', {
        duration: 5000,
        icon: '✅'
      });
      window.history.replaceState({}, '', '/signin');
    }
  }, [location.search]);

  // Handle auth state changes and redirection
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !redirectInProgress) {
          setRedirectInProgress(true);
          navigate(from, { replace: true });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' && !redirectInProgress) {
        setRedirectInProgress(true);
        navigate(from, { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, from, redirectInProgress]);

  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const { error } = await signInWithOAuth('github');
      
      if (error) {
        throw error;
      }
      
      toast.success('Redirecting to GitHub...', {
        icon: '🚀',
        duration: 2000
      });
    } catch (error: any) {
      console.error('Error signing in with GitHub:', error);
      setError(error.message || 'Failed to sign in with GitHub');
      toast.error(error.message || 'Failed to sign in with GitHub');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const { error } = await signInWithOAuth('google');
      
      if (error) {
        throw error;
      }
      
      toast.success('Redirecting to Google...', {
        icon: '🚀',
        duration: 2000
      });
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setError(error.message || 'Failed to sign in with Google');
      toast.error(error.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
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
      
      toast.success('Signed in successfully!');
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
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      toast.error('Please use a valid email address');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      toast.error('Password must be at least 8 characters long');
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
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/signin?confirmed=true`
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('This email is already registered. Please sign in or use a different email.');
        }
        throw error;
      }
      
      if (data.user && !data.session) {
        toast.success('Account created! Please check your email to verify your account.', {
          duration: 7000,
          icon: '📧'
        });
        setIsSignUp(false);
        setPassword('');
      } else {
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
        <div>
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">DF</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
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

        {/* OAuth Buttons */}
        <div className="space-y-3">
          {/* GitHub Button */}
          <button
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Github className="w-5 h-5 mr-3 text-white" />
            <span className="text-sm font-medium text-white">
              Continue with GitHub
            </span>
          </button>
          
          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Continue with Google
            </span>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          <div className="rounded-md shadow-sm space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="sr-only">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Full Name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a
                  href="/password-reset"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span>{isSignUp ? 'Sign up' : 'Sign in'}</span>
              )}
            </Button>
          </div>
        </form>

        {isSignUp && (
          <p className="mt-2 text-center text-xs text-gray-600">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        )}
      </div>
    </div>
  );
};

export default SignIn;