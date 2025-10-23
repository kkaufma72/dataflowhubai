import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

interface PricingCardProps {
  title: string;
  price: number | 'Custom';
  period?: 'monthly' | 'annual';
  features: string[];
  isPopular?: boolean;
  tier: 'starter' | 'professional' | 'team';
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
  const { user } = useUser();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleCTA = async () => {
    if (isFree) {
      navigate('/signin');
      return;
    }

    if (price === 'Custom') {
      // For enterprise, open a contact form or email
      window.location.href = 'mailto:sales@dataflowhubai.com?subject=Enterprise Plan Inquiry';
      return;
    }

    // If user is not authenticated, show email modal
    if (!user) {
      setShowEmailModal(true);
      return;
    }

    // Authenticated user - proceed directly to checkout
    await startCheckout({ tier, billing: billingPeriod });
  };

  const handleEmailSubmit = async () => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');

    // Start checkout with email
    await startCheckout({ tier, billing: billingPeriod, email });
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
          <span className={`text-sm ml-2 ${isPopular ? 'text-indigo-200' : 'text-gray-500'}`}>
            (${annualPrice}/year)
          </span>
        </div>
      );
    }

    return `$${price}`;
  };

  const cardClasses = isPopular
    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-xl shadow-2xl border-4 border-indigo-800 transform scale-105'
    : 'bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow';

  const titleClasses = isPopular ? 'text-white' : 'text-gray-900';
  const priceClasses = isPopular ? 'text-white' : 'text-gray-900';
  const periodClasses = isPopular ? 'text-indigo-200' : 'text-gray-600';
  const featureClasses = isPopular ? 'text-white' : 'text-gray-600';
  const iconClasses = isPopular ? 'text-indigo-300' : 'text-green-500';

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
              onClick={() => setBillingPeriod('monthly')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                billingPeriod === 'monthly'
                  ? isPopular
                    ? 'bg-white text-indigo-600'
                    : 'bg-indigo-600 text-white'
                  : isPopular
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition relative ${
                billingPeriod === 'annual'
                  ? isPopular
                    ? 'bg-white text-indigo-600'
                    : 'bg-indigo-600 text-white'
                  : isPopular
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400'
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
          {error}
        </div>
      )}

      <button
        onClick={handleCTA}
        disabled={loading}
        className={`w-full px-6 py-3 rounded-lg font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
          isPopular
            ? 'bg-white text-indigo-600 hover:bg-gray-100'
            : isFree
            ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {loading ? 'Loading...' : ctaText || 'Get Started'}
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
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
              {emailError && (
                <p className="mt-2 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
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
                onClick={handleEmailSubmit}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
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
