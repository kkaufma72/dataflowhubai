import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import toast from 'react-hot-toast';
interface PricingCardProps {
  title: string;
  price: number | 'Custom';
  period?: 'monthly' | 'annual';
  features: string[];
  isPopular?: boolean;
  tier: 'free' | 'starter' | 'professional' | 'team';
  ctaText?: string;
  isFree?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  period = 'monthly',
  features,
  isPopular = false,
  tier,
  ctaText,
  isFree = false,
}) => {
  const { startCheckout, loading, error } = useStripeCheckout();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Reset modal when loading completes (success or error)
  useEffect(() => {
    if (!loading && showEmailModal) {
      // Don't auto-close, let user see the error
      // Modal will stay open so user can try again
    }
  }, [loading, showEmailModal]);

  const handleCTA = async () => {
    console.log('🎯 handleCTA clicked for tier:', tier);
    console.log('👤 User status:', user ? 'Logged in as ' + user.email : 'Not logged in');
    console.log('🔍 User object:', user);
    console.log('📧 User email:', user?.email);
    
    if (isFree) {
      console.log('📝 Free tier - navigating to signin');
      navigate('/signin');
      return;
    }

    if (price === 'Custom') {
      console.log('💼 Enterprise tier - opening email');
      window.location.href = 'mailto:contact@dataflowhubai.com?subject=Enterprise Plan Inquiry';
      return;
    }

    // Check for user authentication more thoroughly
    if (!user || !user.email) {
      console.log('🔓 No user or no email - showing email modal');
      console.log('User exists:', !!user);
      console.log('User email exists:', !!user?.email);
      setShowEmailModal(true);
      return;
    }

    // Authenticated user - proceed directly to checkout
    console.log('✅ User authenticated - starting checkout directly');
    console.log('📤 Starting checkout with user email:', user.email);
    await startCheckout({ tier, billing: billingPeriod });
  };

  const handleEmailSubmit = async () => {
    console.log('📧 handleEmailSubmit called with email:', email);
    console.log('🎫 Tier:', tier, 'Billing:', billingPeriod);
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      setEmailError('Please enter a valid email address');
      return;
    }
  
    console.log('✅ Email valid, starting checkout...');
    setEmailError('');
  
    // Start checkout with email
    try {
      await startCheckout({ tier, billing: billingPeriod, email });
      console.log('✅ Checkout initiated successfully');
    } catch (err) {
      console.error('❌ Error in handleEmailSubmit:', err);
    }
  };

  const getDisplayPrice = () => {
    if (price === 'Custom') return 'Custom';
    if (price === 0) return '$0';

    // Show discounted price for annual billing
    if (billingPeriod === 'annual') {
      const annualPrice = Math.round(price * 10); // 2 months free
      const monthlyEquivalent = Math.round(annualPrice / 12);
      return (
        <div>
          <span className={isPopular ? 'text-white' : 'text-gray-900'}>
            ${monthlyEquivalent}
          </span>
          <span className={`text-sm ml-2 ${isPopular ? 'text-gray-200' : 'text-gray-500'}`}>
            (${annualPrice}/year)
          </span>
        </div>
      );
    }

    return `$${price}`;
  };

  const cardClasses = isPopular
    ? 'bg-gradient-to-br from-primary-600 to-primary-700 p-8 rounded-xl shadow-2xl border-4 border-indigo-800 transform scale-105'
    : 'bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow';

  const titleClasses = isPopular ? 'text-white' : 'text-gray-900';
  const priceClasses = isPopular ? 'text-white' : 'text-gray-900';
  const periodClasses = isPopular ? 'text-gray-200' : 'text-gray-600';
  const featureClasses = isPopular ? 'text-white' : 'text-gray-600';
  const iconClasses = isPopular ? 'text-green-400' : 'text-green-500';

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-2xl font-bold ${titleClasses}`}>{title}</h3>
        {isPopular && (
          <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
            POPULAR
          </span>
        )}
      </div>

      {!isFree && price !== 'Custom' && (
        <div className="mb-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                console.log('📅 Billing period changed to: monthly');
                setBillingPeriod('monthly');
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                billingPeriod === 'monthly'
                  ? isPopular
                    ? 'bg-white text-primary-600'
                    : 'bg-primary-600 text-white'
                  : isPopular
                  ? 'bg-primary text-white hover:bg-indigo-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => {
                console.log('📅 Billing period changed to: annual');
                setBillingPeriod('annual');
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition relative ${
                billingPeriod === 'annual'
                  ? isPopular
                    ? 'bg-white text-primary-600'
                    : 'bg-primary-600 text-white'
                  : isPopular
                  ? 'bg-primary text-white hover:bg-indigo-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className={`text-4xl font-bold ${priceClasses}`}>
          {getDisplayPrice()}
        </div>
        {price !== 'Custom' && (
          <span className={periodClasses}>
            {billingPeriod === 'annual' ? '/month, billed annually' : '/month'}
          </span>
        )}
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className={`flex items-center ${featureClasses}`}>
            <CheckCircle className={`w-5 h-5 ${iconClasses} mr-3 flex-shrink-0`} />
            {feature}
          </li>
        ))}
      </ul>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleCTA}
        disabled={loading}
        className={`w-full px-6 py-3 rounded-lg font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
          isPopular
            ? 'bg-white text-primary-600 hover:bg-gray-100'
            : isFree
            ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          ctaText || 'Get Started'
        )}
      </button>

      {/* Email Modal for unauthenticated users */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Enter your email to continue
            </h3>
            <p className="text-gray-600 mb-6">
              We'll send you a link to complete your registration after payment.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  console.log('📝 Email input changed:', e.target.value);
                  setEmail(e.target.value);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    console.log('⏎ Enter key pressed');
                    handleEmailSubmit();
                  }
                }}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                autoFocus
              />
              {emailError && (
                <p className="mt-2 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  console.log('❌ Cancel clicked - closing modal');
                  setShowEmailModal(false);
                  setEmail('');
                  setEmailError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('💳 Continue to Payment clicked');
                  handleEmailSubmit();
                }}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Continue to Payment'
                )}
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      )}
    </div>
  );
};