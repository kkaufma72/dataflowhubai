import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

export const useCustomerPortal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const openPortal = async () => {
    if (!user) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: portalError } = await supabase.functions.invoke(
        'create-customer-portal',
        { body: {} }
      );

      if (portalError) throw portalError;

      if (!data || !data.url) {
        throw new Error('No portal URL returned');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;

    } catch (err) {
      console.error('Portal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open customer portal');
      setLoading(false);
    }
  };

  return { openPortal, loading, error };
};
