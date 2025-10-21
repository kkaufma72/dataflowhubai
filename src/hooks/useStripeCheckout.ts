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
      // Get the price ID
      const priceId = STRIPE_PRICES[tier][billing];
      
      if (!priceId) {
        throw new Error('Invalid pricing tier');
      }

      // Call your backend to create checkout session
      const { data, error: sessionError } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            priceId,
            userId: user.id,
            userEmail: user.email,
            tier,
            billing,
          },
        }
      );

      if (sessionError) throw sessionError;

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) throw stripeError;

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return { startCheckout, loading, error };
};