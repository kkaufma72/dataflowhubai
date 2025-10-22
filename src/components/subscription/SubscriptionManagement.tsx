import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { CreditCard, Check, Loader2, ExternalLink, Crown } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface PricingPlan {
  name: string;
  tier: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  popular?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Free',
    tier: 'free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Up to 3 datasets',
      'Basic visualizations',
      'Community support',
      '100 MB storage',
    ],
  },
  {
    name: 'Starter',
    tier: 'starter',
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      'Up to 10 datasets',
      'Advanced visualizations',
      'Email support',
      '5 GB storage',
      'API access',
    ],
  },
  {
    name: 'Professional',
    tier: 'professional',
    monthlyPrice: 99,
    annualPrice: 990,
    popular: true,
    features: [
      'Unlimited datasets',
      'Advanced AutoML',
      'Priority support',
      '50 GB storage',
      'Advanced API access',
      'Custom integrations',
    ],
  },
  {
    name: 'Team',
    tier: 'team',
    monthlyPrice: 299,
    annualPrice: 2990,
    features: [
      'Everything in Professional',
      'Team collaboration (up to 10 users)',
      'Dedicated support',
      '500 GB storage',
      'Advanced security features',
      'SLA guarantees',
    ],
  },
];

const SubscriptionManagement: React.FC = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [processingTier, setProcessingTier] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    if (!user) {
      toast.error('You must be logged in to upgrade');
      return;
    }

    if (tier === 'free') {
      toast.error('Please contact support to downgrade your plan');
      return;
    }

    setProcessingTier(tier);

    try {
      // Get the appropriate price ID based on tier and billing cycle
      const priceIdKey = `VITE_STRIPE_${tier.toUpperCase()}_${billingCycle.toUpperCase()}_PRICE_ID`;
      const priceId = import.meta.env[priceIdKey];

      if (!priceId) {
        throw new Error('Price ID not configured');
      }

      // Call Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          tier,
          billing: billingCycle,
        },
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setProcessingTier(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-billing-portal');

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error('Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const currentTier = subscription?.tier || 'free';
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';

  return (
    <div className="space-y-8">
      {/* Current Subscription */}
      {subscription && isActive && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Crown className="w-5 h-5 mr-2 text-indigo-600" />
              Current Subscription
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="text-lg font-semibold capitalize">{subscription.tier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Billing Cycle</p>
                <p className="text-lg font-semibold capitalize">{subscription.billing_cycle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold capitalize">{subscription.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Billing Date</p>
                <p className="text-lg font-semibold">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
            {subscription.cancel_at_period_end && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Your subscription will be canceled at the end of the current billing period.
                </p>
              </div>
            )}
            <div className="mt-6">
              <Button
                onClick={handleManageBilling}
                variant="outline"
                className="flex items-center"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Billing
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'annual'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRICING_PLANS.map((plan) => {
          const isCurrentPlan = plan.tier === currentTier;
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
          const pricePerMonth = billingCycle === 'annual' ? Math.round(price / 12) : price;

          return (
            <Card
              key={plan.tier}
              className={`relative ${
                plan.popular
                  ? 'border-2 border-indigo-600 shadow-lg'
                  : isCurrentPlan
                  ? 'border-2 border-green-500'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    POPULAR
                  </span>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    CURRENT PLAN
                  </span>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">${pricePerMonth}</span>
                  <span className="text-gray-600">/month</span>
                  {billingCycle === 'annual' && price > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Billed ${price} annually
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgrade(plan.tier)}
                  disabled={isCurrentPlan || processingTier === plan.tier}
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {processingTier === plan.tier ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.tier === 'free' ? (
                    'Get Started'
                  ) : (
                    'Upgrade'
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionManagement;
