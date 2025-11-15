import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PricingCard } from '../components/PricingCard';
import { StripeDemoInfo } from '../components/StripeDemoInfo';
import toast from 'react-hot-toast';

const PricingPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle redirect parameters from Stripe
    const canceled = searchParams.get('canceled');
    const success = searchParams.get('success');
    
    if (canceled === 'true') {
      toast.error('Payment canceled. You can try again anytime.');
    } else if (success === 'true') {
      toast.success('Payment successful! Check your email to set up your account.');
    }
  }, [searchParams]);
  const pricingPlans = [
    {
      title: 'Free',
      price: 0,
      tier: 'free' as const,
      features: [
        '3 datasets',
        '20 AI questions/month',
        'Basic visualizations',
        'CSV export',
        'Community support',
      ],
      ctaText: 'Get Started',
      isFree: true,
    },
    {
      title: 'Professional',
      price: 49,
      tier: 'professional' as const,
      features: [
        'Unlimited datasets',
        'Unlimited AI questions',
        'Advanced visualizations',
        'ML model training',
        'Natural language transformations',
        'Voice input',
        'All export formats',
        'Priority support',
      ],
      ctaText: 'Upgrade to Pro',
      isPopular: true,
    },
    {
      title: 'Team',
      price: 149,
      tier: 'team' as const,
      features: [
        'Everything in Pro',
        'Team collaboration (5 users)',
        'Shared workspaces',
        'Admin controls',
        'SSO integration',
        'Audit logs',
        'Custom branding',
        'Dedicated support',
      ],
      ctaText: 'Contact Sales',
    },
  ];

  return (
    <>
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <span className="badge-pro shadow-md">
              🎯 BETA PRICING - Early Adopter Benefits
            </span>
          </div>
          <h1 className="page-title text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="page-subtitle text-primary-100 mb-4">
            Start free forever, upgrade when you need more
          </p>
          <p className="body-text text-primary-200">
            No credit card required • Free tier always available
          </p>
          <p className="section-subtitle text-primary-200 mt-3">
            Beta users get grandfathered into special lifetime pricing
          </p>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {pricingPlans.map((plan) => (
              <PricingCard
                key={plan.tier}
                title={plan.title}
                price={plan.price}
                tier={plan.tier}
                features={plan.features}
                ctaText={plan.ctaText}
                isPopular={plan.isPopular}
                isFree={plan.isFree}
              />
            ))}
          </div>

          {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.includes('test') && (
            <div className="max-w-4xl mx-auto">
              <StripeDemoInfo />
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans at any time?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time through your account settings.
                Changes to your plan will be prorated.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, MasterCard, American Express, Discover) through our secure
                payment processor, Stripe.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! All paid plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens when I cancel?
              </h3>
              <p className="text-gray-600">
                You'll continue to have access to your paid plan features until the end of your billing period.
                After that, your account will be downgraded to the free plan.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer discounts for annual billing?
              </h3>
              <p className="text-gray-600">
                Yes! Save 17% when you pay annually. You will get 2 months free compared to monthly billing.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need something custom?
              </h3>
              <p className="text-gray-600">
                For enterprise needs, custom integrations, or volume discounts, contact our sales team at{' '}
                <a href="mailto:sales@dataflowhubai.com" className="text-primary-600 hover:text-primary-700">
                  sales@dataflowhubai.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary/10 mb-8">
            Join thousands of data teams building better models faster
          </p>
          
          <a
            href="/signin"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg hover:shadow-xl"
          >
            Get Started Free
          </a>
        </div>
      </section>
    </>
  );
};

export default PricingPage;