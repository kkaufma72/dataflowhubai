import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Mail, Loader, AlertCircle } from 'lucide-react';

const SignupComplete: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Simulate checking subscription status
    // In production, you'd verify the session with Stripe
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <Loader className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-purple-600 mb-2">
            Processing your payment...
          </h2>
          <p className="text-gray-600">Please wait while we set up your account.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-purple-600 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't complete your signup. Please try creating an account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/signin')}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Go to Sign Up
              </button>
              <button
                onClick={() => window.location.href = 'mailto:support@dataflowhubai.com'}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600">
            Welcome to DataFlowHub AI
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="h-6 w-6 text-indigo-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-indigo-900 mb-2">
                Check your email
              </h3>
              <p className="text-indigo-800 text-sm mb-4">
                We've sent you an email with a link to set up your password and complete your registration.
                Click the link in the email to activate your account and start using DataFlowHub AI.
              </p>
              <div className="bg-white rounded p-3 border border-indigo-200">
                <p className="text-xs text-indigo-700 font-medium mb-1">
                  IMPORTANT:
                </p>
                <p className="text-xs text-indigo-600">
                  The email link expires in 24 hours. If you don't see the email, check your spam folder.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            What happens next?
          </h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <strong>Check your email</strong> and click the activation link
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <strong>Set your password</strong> and complete your profile
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <strong>Start building</strong> ML models with your premium features
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Session ID</p>
              <p className="text-gray-900 font-mono text-xs truncate">{sessionId}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Status</p>
              <p className="text-green-600 font-semibold">Payment Confirmed</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/signin')}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
          >
            Continue to Sign In
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? <a href="mailto:support@dataflowhubai.com" className="text-indigo-600 hover:text-indigo-700">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default SignupComplete;
