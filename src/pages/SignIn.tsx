import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import Card from '../components/common/Card';
import Logo from '../components/common/Logo';
import { Mail, Lock, Loader2, AlertCircle, User, ArrowLeft, Github } from 'lucide-react';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { 
  storePostAuthRedirectPath,
  clearPostAuthRedirectPath
} from '../constants/auth';

// Email validation function to prevent fake/test emails
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
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
  const { user, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Use ref to prevent multiple redirects
  const hasRedirected = useRef(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [useCase, setUseCase] = useState<string>('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Always redirect to dashboard after sign-in
  const getRedirectDestination = useCallback(() => {
    return '/app';
  }, []);

  // Stable redirect function
  const performRedirect = useCallback(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    
    const destination = getRedirectDestination();
    clearPostAuthRedirectPath();
    navigate(destination, { replace: true });
  }, [navigate, getRedirectDestination]);

  // Check for email verification success (only once)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      toast.success('Email verified successfully! Please sign in to continue.', {
        duration: 5000,
        icon: '✅'
      });
      // Use replaceState without triggering re-render
      window.history.replaceState({}, document.title, '/signin');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if user is already authenticated (uses AuthProvider state)
  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    // If user is authenticated, redirect
    if (user && !hasRedirected.current) {
      performRedirect();
    }
  }, [user, authLoading, performRedirect]);

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
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password. Please try again or reset your password.');
        }
        if (error.message === 'Email not confirmed') {
          throw new Error('Email verification is required. Please check Supabase settings and disable email confirmation for development, or check your email for the verification link.');
        }
        throw error;
      }
      
      // Successful signin - redirect to dashboard
      toast.success('Signed in successfully!');
      hasRedirected.current = true;
      const destination = getRedirectDestination();
      clearPostAuthRedirectPath();
      
      // Use a small delay to ensure auth state is updated
      setTimeout(() => {
        window.location.href = destination;
      }, 100);
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
    
    // Validate required fields
    if (!email || !password || !fullName || !useCase) {
      setError('Please fill in all required fields');
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address from a real email provider');
      toast.error('Please use a real email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('Starting signup with profile:', {
        email,
        fullName,
        company,
        jobTitle,
        useCase,
        hasLinkedIn: !!linkedinUrl
      });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            use_case: useCase || 'general',
            company: company || '',
            job_title: jobTitle || '',
            linkedin_url: linkedinUrl || '',
          },
          emailRedirectTo: `${window.location.origin}/signin?verified=true`,
        }
      });
      
      console.log('Signup response:', { data, error });
      
      if (error) {
        console.error('Supabase signup error:', error);
        
        // Handle specific error cases
        if (error.message === 'User already registered') {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        if (error.message.includes('Email rate limit exceeded')) {
          throw new Error('Too many signup attempts. Please wait a few minutes and try again.');
        }
        if (error.message.includes('Database error')) {
          throw new Error('Database connection issue. Please try again in a moment.');
        }
        if (error.message.includes('invalid') && error.message.includes('api')) {
          throw new Error('API configuration issue. Please check Supabase settings (see SUPABASE_AUTH_FIX.md)');
        }
        
        // Generic error with full message
        throw new Error(error.message || 'Signup failed. Please try again.');
      }
      
      if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        // Create user profile immediately
        try {
          console.log('📝 Creating user profile...');
          const { error: profileError } = await supabase.from('user_profiles').insert([{
            user_id: data.user.id,
            full_name: fullName,
            email: email,
            use_case: useCase || 'general',
            company: company || '',
            job_title: jobTitle || '',
            linkedin_url: linkedinUrl || '',
          }]);
          
          if (profileError) {
            console.error('❌ Error creating profile:', profileError);
          } else {
            console.log('✅ User profile created');
          }
        } catch (profileErr) {
          console.error('❌ Error in profile creation:', profileErr);
        }
        
        toast.success('🎉 Account created successfully!', {
          duration: 5000,
          icon: '✅'
        });
        
        // Automatically sign in the user and redirect to dashboard
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) {
            console.error('Auto sign-in error:', signInError);
            // Show success but require manual sign-in
            setIsSignUp(false);
            setPassword('');
            toast.success('Please sign in with your new credentials', {
              duration: 5000,
            });
          } else {
            console.log('✅ Auto sign-in successful, redirecting to dashboard...');
            toast.success('Welcome! Redirecting to your dashboard...', {
              duration: 3000,
            });
            
            // Redirect to dashboard immediately - don't wait for effect
            hasRedirected.current = true;
            const destination = getRedirectDestination();
            clearPostAuthRedirectPath();
            setTimeout(() => {
              navigate(destination, { replace: true });
            }, 500);
          }
        } catch (signInErr) {
          console.error('Auto sign-in failed:', signInErr);
          setIsSignUp(false);
          setPassword('');
          toast.success('You can now sign in with your credentials!', {
            duration: 5000,
          });
        }
      }
    } catch (error: any) {
      console.error('Error during signup:', error);
      setError(error.message || 'An error occurred during signup');
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      setError('');
      const destination = getRedirectDestination();
      storePostAuthRedirectPath(destination);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/app/auth/callback`,
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      setError(error.message);
      toast.error(`Failed to sign in with ${provider}`);
    }
  };

  const handlePasswordReset = () => {
    navigate('/password-reset');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 flex flex-col">
      {/* Header with Logo and Back Button */}
      <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-primary-600 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div>
            <div className="flex justify-center mb-8">
              <Logo variant="horizontal" size="lg" showTagline={true} />
            </div>
            <h2 className="text-center text-3xl font-bold text-gray-900">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isSignUp 
                ? 'Start building ML models in minutes' 
                : 'Sign in to continue to your workspace'}
            </p>
          </div>

          {/* Auth Card */}
          <Card className="shadow-xl">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleOAuthSignIn('google')}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors group"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  Continue with Google
                </span>
              </button>

              <button
                onClick={() => handleOAuthSignIn('github')}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors group"
              >
                <Github className="w-5 h-5 mr-3 text-gray-700 group-hover:text-gray-900" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  Continue with GitHub
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>
            
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-6">
              {/* Full Name Field (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              {/* Company Field (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary transition-colors"
                    placeholder="Acme Corp"
                  />
                </div>
              )}

              {/* Job Title Field (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary transition-colors"
                    placeholder="Data Scientist"
                  />
                </div>
              )}

              {/* LinkedIn URL Field (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Profile (Optional)
                  </label>
                  <input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary transition-colors"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Helps us tailor AI responses to your industry and expertise
                  </p>
                </div>
              )}

              {/* Use Case Field (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Use Case
                  </label>
                  <select
                    id="useCase"
                    name="useCase"
                    required
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary transition-colors"
                  >
                    <option value="">What will you use this app for?</option>
                    
                    <optgroup label="💼 Business & Finance">
                      <option value="accounting">Accounting & Bookkeeping</option>
                      <option value="financial-management">Financial Management & Planning</option>
                      <option value="taxes">Tax Preparation & Analysis</option>
                      <option value="budgeting">Budgeting & Expense Tracking</option>
                      <option value="invoicing">Invoicing & Billing</option>
                      <option value="payroll">Payroll Management</option>
                    </optgroup>
                    
                    <optgroup label="🏢 Industry-Specific">
                      <option value="real-estate">Real Estate & Property Management</option>
                      <option value="retail">Retail & E-commerce</option>
                      <option value="healthcare">Healthcare & Medical Records</option>
                      <option value="legal">Legal & Compliance</option>
                      <option value="manufacturing">Manufacturing & Inventory</option>
                      <option value="construction">Construction & Project Management</option>
                    </optgroup>
                    
                    <optgroup label="📊 Analytics & Insights">
                      <option value="business-analytics">Business Analytics & Reporting</option>
                      <option value="customer-insights">Customer Data & CRM</option>
                      <option value="sales-forecasting">Sales Forecasting</option>
                      <option value="marketing-analytics">Marketing & Campaign Analytics</option>
                      <option value="hr-analytics">HR & Workforce Analytics</option>
                    </optgroup>
                    
                    <optgroup label="🎯 Personal Use">
                      <option value="personal-finance">Personal Finance & Investments</option>
                      <option value="personal-projects">Personal Projects & Research</option>
                      <option value="education">Education & Learning</option>
                    </optgroup>
                    
                    <optgroup label="🔬 Advanced">
                      <option value="predictive-analytics">Predictive Analytics & Forecasting</option>
                      <option value="fraud-detection">Fraud Detection & Security</option>
                      <option value="risk-management">Risk Management</option>
                      <option value="data-science">General Data Science & ML</option>
                    </optgroup>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Personalizes your AI assistant's responses
                  </p>
                </div>
              )}
              
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary transition-colors"
                    placeholder="you@company.com"
                  />
                </div>
                {isSignUp && (
                  <p className="mt-2 text-xs text-gray-500">
                    Note: Email verification is disabled for development. You can sign in immediately after creating your account.
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary transition-colors"
                    placeholder={isSignUp ? "At least 8 characters" : "••••••••"}
                  />
                </div>
                {isSignUp && (
                  <p className="mt-2 text-xs text-gray-500">
                    Must be at least 8 characters long
                  </p>
                )}
              </div>

              {/* Password Reset - Temporarily disabled during beta */}
              {!isSignUp && (
                <div className="flex items-center justify-end">
                  <p className="text-sm text-gray-500">
                    Forgot password? Email{' '}
                    <a 
                      href="mailto:support@dataflowhub.ai" 
                      className="text-primary-600 hover:text-primary font-medium"
                    >
                      support@dataflowhub.ai
                    </a>
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-base font-semibold"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            {/* Toggle Sign In/Sign Up */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isSignUp 
                  ? 'Already have an account? ' 
                  : "Don't have an account? "}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="font-semibold text-primary-600 hover:text-primary transition-colors"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          </Card>

          {/* Terms and Privacy */}
          <p className="text-center text-xs text-gray-500">
            By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:text-primary">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-600 hover:text-primary">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
