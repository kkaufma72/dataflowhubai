import { useState } from 'react';
import { stripePromise, STRIPE_PRICES } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

interface CheckoutOptions {
  tier: 'starter' | 'professional' | 'team';
  billing: 'monthly' | 'annual';
}

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const startCheckout = async ({ tier, billing }: CheckoutOptions) => {
    if (!user) {
      setError('You must be logged in to upgrade');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call backend to create checkout session
      const { data, error: sessionError } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            tier,
            billing,
          },
        }
      );

      if (sessionError) throw sessionError;

      if (!data || !data.url) {
        throw new Error('No checkout URL returned');
      }

      // Redirect to Stripe Checkout URL
      window.location.href = data.url;

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(false);
    }
  };

  return { startCheckout, loading, error };
};