import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import toast from 'react-hot-toast';

const PasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  
  // Check if we have a hash in the URL (for password reset)
  useEffect(() => {
    const hash = location.hash;
    if (hash && hash.includes('type=recovery')) {
      setMode('reset');
    }
  }, [location]);

  // Request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset#recovery`
      });
      
      if (error) throw error;
      
      setIsSuccess(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setError('Failed to send password reset email. Please try again.');
      toast.error('Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter a new password');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) throw error;
      
      setIsSuccess(true);
      toast.success('Password reset successfully');
      
      // Redirect to sign in page after a delay
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password. Please try again.');
      toast.error('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Lock className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'request' ? 'Reset your password' : 'Create new password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {mode === 'request' 
            ? 'Enter your email and we\'ll send you a link to reset your password' 
            : 'Enter your new password below'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          {isSuccess ? (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                {mode === 'request' 
                  ? 'Check your email' 
                  : 'Password reset successful'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {mode === 'request' 
                  ? 'We\'ve sent a password reset link to your email address.' 
                  : 'Your password has been reset successfully. Redirecting to login...'}
              </p>
              {mode === 'request' && (
                <Button
                  className="mt-6"
                  onClick={() => navigate('/signin')}
                >
                  Return to Sign In
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={mode === 'request' ? handleRequestReset : handleResetPassword}>
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
              
              {mode === 'request' ? (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </>
              )}
              
              <div className="mt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                >
                  {isLoading 
                    ? 'Processing...' 
                    : mode === 'request' 
                      ? 'Send Reset Link' 
                      : 'Reset Password'}
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/signin')}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PasswordReset;