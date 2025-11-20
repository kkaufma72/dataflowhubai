import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { isStripeReady } from '../../lib/stripeConfigCheck';

interface Tier {
  name: string;
  price: { monthly: number | null; annual: number | null };
  description: string;
  features: string[];
  limits: {
    datasets: string;
    storage: string;
    models: string;
    apiCalls: string;
  };
  cta: string;
  highlighted: boolean;
}

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

  const tiers: Tier[] = [
    {
      name: 'Free',
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for getting started',
      features: [
        '3 datasets',
        '100 MB storage',
        'Basic ML models',
        'Standard visualizations',
        'Community support',
        '7-day data retention'
      ],
      limits: {
        datasets: '3',
        storage: '100 MB',
        models: '2',
        apiCalls: '100/month'
      },
      cta: 'Get Started',
      highlighted: false
    },
    {
      name: 'Starter',
      price: { monthly: 25, annual: 250 },
      description: 'For individuals and small teams',
      features: [
        '25 datasets',
        '5 GB storage',
        'Advanced ML models',
        'Custom visualizations',
        'Email support',
        '30-day data retention',
        'API access',
        'Export capabilities'
      ],
      limits: {
        datasets: '25',
        storage: '5 GB',
        models: '10',
        apiCalls: '1,000/month'
      },
      cta: 'Start Free Trial',
      highlighted: false
    },
    {
      name: 'Professional',
      price: { monthly: 49, annual: 490 },
      description: 'For growing businesses',
      features: [
        'Unlimited datasets',
        '50 GB storage',
        'All ML models',
        'Advanced analytics',
        'Priority support',
        'Unlimited data retention',
        'Full API access',
        'Team collaboration (5 users)',
        'Custom integrations',
        'Advanced security'
      ],
      limits: {
        datasets: 'Unlimited',
        storage: '50 GB',
        models: 'Unlimited',
        apiCalls: '10,000/month'
      },
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: { monthly: null, annual: null },
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'Custom storage limits',
        'Unlimited team members',
        'Dedicated support',
        'SLA guarantee',
        'Custom training',
        'White-label options',
        'SSO & advanced security',
        'Custom deployment',
        'Dedicated account manager'
      ],
      limits: {
        datasets: 'Unlimited',
        storage: 'Custom',
        models: 'Unlimited',
        apiCalls: 'Unlimited'
      },
      cta: 'Talk to Sales',
      highlighted: false
    }
  ];

  const handleSelectPlan = (tier: string) => {
    if (tier === 'Free') {
      window.location.href = '/signin';
      return;
    }

    if (tier === 'Enterprise') {
      window.location.href = 'mailto:sales@dataflow.ai?subject=Enterprise Plan Inquiry';
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
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {tiers.map((tier) => {
          const isCurrentTier = tier.name.toLowerCase() === currentTier.toLowerCase();

          return (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-6 ${
                tier.highlighted
                  ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-500 shadow-xl scale-105'
                  : 'bg-white border-2 border-gray-200 hover:border-gray-300 shadow-sm'
              } transition-all duration-200`}
            >
              {/* Popular Badge */}
              {tier.highlighted && (
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-sm text-gray-600">{tier.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {tier.price.monthly === null ? (
                  <div className="text-3xl font-bold text-gray-900">Custom Pricing</div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">
                        ${billingPeriod === 'monthly' ? tier.price.monthly : Math.round(tier.price.annual! / 12)}
                      </span>
                      {tier.price.monthly > 0 && (
                        <span className="text-gray-600">
                          /{billingPeriod === 'monthly' ? 'mo' : 'year'}
                        </span>
                      )}
                    </div>
                    {billingPeriod === 'annual' && tier.price.annual! > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        Save ${tier.price.monthly * 12 - tier.price.annual!}/year
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(tier.name)}
                disabled={!stripeReady && tier.name !== 'Enterprise' && tier.name !== 'Free'}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 mb-6 ${
                  tier.highlighted
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-white border-2 border-gray-300 hover:border-indigo-500 text-gray-700 hover:text-indigo-600'
                } ${!stripeReady && tier.name !== 'Enterprise' && tier.name !== 'Free' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {tier.cta}
              </button>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Key Features
                </p>
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
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
                    <span className="text-gray-500">Storage:</span>
                    <span className="ml-1 font-semibold text-gray-900">{tier.limits.storage}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">API Calls:</span>
                    <span className="ml-1 font-semibold text-gray-900">{tier.limits.apiCalls}</span>
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
                  {tiers.map((tier) => (
                    <th
                      key={tier.name}
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
                  {tiers.map((tier) => (
                    <td key={tier.name} className="py-3 px-6 text-center text-sm font-semibold">
                      {tier.limits.datasets}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-6 text-sm text-gray-700">ML Models</td>
                  {tiers.map((tier) => (
                    <td key={tier.name} className="py-3 px-6 text-center text-sm font-semibold">
                      {tier.limits.models}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-6 text-sm text-gray-700">Storage</td>
                  {tiers.map((tier) => (
                    <td key={tier.name} className="py-3 px-6 text-center text-sm font-semibold">
                      {tier.limits.storage}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-6 text-sm text-gray-700">API Calls</td>
                  {tiers.map((tier) => (
                    <td key={tier.name} className="py-3 px-6 text-center text-sm font-semibold">
                      {tier.limits.apiCalls}
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
