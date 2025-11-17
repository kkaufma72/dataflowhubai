import React, { useState } from 'react';
import { Check, X, Sparkles, Zap, Users, Crown } from 'lucide-react';
import Button from '../common/Button';
import { isStripeReady } from '../../lib/stripeConfigCheck';

interface PricingTier {
  name: string;
  tier: 'free' | 'starter' | 'professional' | 'team';
  icon: React.ReactNode;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyPriceDisplay: string;
  annualPriceDisplay: string;
  features: {
    included: string[];
    notIncluded?: string[];
  };
  limits: {
    datasets: string;
    models: string;
    users: string;
    storage: string;
  };
  cta: string;
  popular?: boolean;
  comingSoon?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    tier: 'free',
    icon: <Sparkles className="w-6 h-6" />,
    description: 'Perfect for getting started with AutoML',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyPriceDisplay: '$0',
    annualPriceDisplay: '$0',
    features: {
      included: [
        'Up to 3 datasets',
        'Basic ML models',
        'Data quality checks',
        'CSV & Excel upload',
        'Community support',
        '500 MB storage',
      ],
      notIncluded: [
        'Advanced models',
        'API access',
        'Custom deployments',
        'Priority support',
      ],
    },
    limits: {
      datasets: '3',
      models: '5',
      users: '1',
      storage: '500 MB',
    },
    cta: 'Get Started Free',
  },
  {
    name: 'Starter',
    tier: 'starter',
    icon: <Zap className="w-6 h-6" />,
    description: 'For individuals and small teams',
    monthlyPrice: 25,
    annualPrice: 250,
    monthlyPriceDisplay: '$25',
    annualPriceDisplay: '$250',
    features: {
      included: [
        'Up to 25 datasets',
        'All ML model types',
        'Advanced data profiling',
        'API access (1,000 calls/month)',
        'Email support',
        '10 GB storage',
        'Data quality dashboard',
        'Basic visualizations',
      ],
    },
    limits: {
      datasets: '25',
      models: '50',
      users: '1',
      storage: '10 GB',
    },
    cta: 'Start 14-Day Trial',
  },
  {
    name: 'Professional',
    tier: 'professional',
    icon: <Crown className="w-6 h-6" />,
    description: 'For growing businesses and data teams',
    monthlyPrice: 99,
    annualPrice: 990,
    monthlyPriceDisplay: '$99',
    annualPriceDisplay: '$990',
    popular: true,
    features: {
      included: [
        'Unlimited datasets',
        'Advanced ML models',
        'AutoML pipeline builder',
        'API access (10,000 calls/month)',
        'Priority email & chat support',
        '100 GB storage',
        'Real-time monitoring',
        'Custom deployments',
        'Advanced visualizations',
        'Model explainability',
        'Scheduled retraining',
      ],
    },
    limits: {
      datasets: 'Unlimited',
      models: 'Unlimited',
      users: '3',
      storage: '100 GB',
    },
    cta: 'Start 14-Day Trial',
  },
  {
    name: 'Team',
    tier: 'team',
    icon: <Users className="w-6 h-6" />,
    description: 'For enterprises with advanced needs',
    monthlyPrice: 299,
    annualPrice: 2990,
    monthlyPriceDisplay: '$299',
    annualPriceDisplay: '$2,990',
    features: {
      included: [
        'Everything in Professional',
        'Unlimited team members',
        'API access (100,000 calls/month)',
        'Dedicated account manager',
        '1 TB storage',
        'SSO & advanced security',
        'Custom integrations',
        'On-premise deployment option',
        'SLA guarantee (99.9% uptime)',
        'Custom training sessions',
        'White-label options',
      ],
    },
    limits: {
      datasets: 'Unlimited',
      models: 'Unlimited',
      users: 'Unlimited',
      storage: '1 TB',
    },
    cta: 'Start 14-Day Trial',
  },
];

interface PricingTableProps {
  onSelectPlan?: (tier: string, billing: 'monthly' | 'annual') => void;
  currentTier?: string;
  showComparison?: boolean;
}

const PricingTable: React.FC<PricingTableProps> = ({
  onSelectPlan,
  currentTier = 'free',
  showComparison = true,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const stripeReady = isStripeReady();

  const handleSelectPlan = (tier: string) => {
    if (tier === 'free') {
      // Navigate to sign up for free
      window.location.href = '/signin';
      return;
    }

    if (!stripeReady) {
      alert('Payment processing is temporarily unavailable. Please try again later.');
      return;
    }

    if (onSelectPlan) {
      onSelectPlan(tier, billingPeriod);
    }
  };

  const getAnnualSavings = (monthly: number, annual: number) => {
    const monthlyCost = monthly * 12;
    const savings = monthlyCost - annual;
    const savingsPercent = Math.round((savings / monthlyCost) * 100);
    return { savings, savingsPercent };
  };

  return (
    <div className="w-full">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-12">
        <div className="bg-gray-100 rounded-full p-1 inline-flex">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              billingPeriod === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
              Save up to 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {pricingTiers.map((tier) => {
          const isCurrentTier = tier.tier === currentTier;
          const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
          const priceDisplay = billingPeriod === 'monthly' ? tier.monthlyPriceDisplay : tier.annualPriceDisplay;
          const savings = billingPeriod === 'annual' ? getAnnualSavings(tier.monthlyPrice, tier.annualPrice) : null;

          return (
            <div
              key={tier.tier}
              className={`relative rounded-2xl p-6 ${
                tier.popular
                  ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-500 shadow-xl scale-105'
                  : 'bg-white border-2 border-gray-200 hover:border-gray-300 shadow-sm'
              } transition-all duration-200`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentTier && (
                <div className="absolute -top-4 right-4">
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                    CURRENT
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${
                  tier.popular ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  {tier.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-sm text-gray-600">{tier.description}</p>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">{priceDisplay}</span>
                  {price > 0 && (
                    <span className="ml-2 text-gray-600">
                      /{billingPeriod === 'monthly' ? 'mo' : 'year'}
                    </span>
                  )}
                </div>
                {billingPeriod === 'annual' && savings && savings.savings > 0 && (
                  <p className="mt-2 text-sm text-green-600 font-semibold">
                    Save ${savings.savings}/year ({savings.savingsPercent}% off)
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectPlan(tier.tier)}
                className={`w-full mb-6 ${
                  tier.popular
                    ? 'btn-primary-improved'
                    : 'bg-white border-2 border-gray-300 hover:border-indigo-500 text-gray-700 hover:text-indigo-600 font-semibold'
                } ${isCurrentTier ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isCurrentTier}
              >
                {isCurrentTier ? 'Current Plan' : tier.cta}
              </Button>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Key Features
                </p>
                {tier.features.included.slice(0, 6).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
                {tier.features.included.length > 6 && (
                  <p className="text-xs text-gray-500 italic">
                    + {tier.features.included.length - 6} more features
                  </p>
                )}
              </div>

              {/* Limits */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                  Usage Limits
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Datasets:</span>
                    <span className="ml-1 font-semibold text-gray-900">{tier.limits.datasets}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Models:</span>
                    <span className="ml-1 font-semibold text-gray-900">{tier.limits.models}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Users:</span>
                    <span className="ml-1 font-semibold text-gray-900">{tier.limits.users}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Storage:</span>
                    <span className="ml-1 font-semibold text-gray-900">{tier.limits.storage}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      {showComparison && (
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Compare All Features
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-b-2 border-gray-200">
                    Feature
                  </th>
                  {pricingTiers.map((tier) => (
                    <th
                      key={tier.tier}
                      className="text-center py-4 px-6 font-semibold text-gray-900 border-b-2 border-gray-200"
                    >
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-6 text-sm text-gray-700">Datasets</td>
                  {pricingTiers.map((tier) => (
                    <td key={tier.tier} className="py-3 px-6 text-center text-sm font-semibold">
                      {tier.limits.datasets}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-6 text-sm text-gray-700">ML Models</td>
                  {pricingTiers.map((tier) => (
                    <td key={tier.tier} className="py-3 px-6 text-center text-sm font-semibold">
                      {tier.limits.models}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-6 text-sm text-gray-700">Team Members</td>
                  {pricingTiers.map((tier) => (
                    <td key={tier.tier} className="py-3 px-6 text-center text-sm font-semibold">
                      {tier.limits.users}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-6 text-sm text-gray-700">Storage</td>
                  {pricingTiers.map((tier) => (
                    <td key={tier.tier} className="py-3 px-6 text-center text-sm font-semibold">
                      {tier.limits.storage}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-6 text-sm text-gray-700">API Access</td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-6 text-sm text-gray-700">Model Deployment</td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-6 text-sm text-gray-700">Real-time Monitoring</td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-6 text-sm text-gray-700">Priority Support</td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-6 text-sm text-gray-700">SSO & Advanced Security</td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-6 text-sm text-gray-700">Dedicated Account Manager</td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="py-3 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingTable;
