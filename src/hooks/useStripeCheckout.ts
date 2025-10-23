import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';

interface CheckoutOptions {
  tier: 'starter' | 'professional' | 'team';
  billing: 'monthly' | 'annual';
  email?: string;
}

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const startCheckout = async ({ tier, billing, email }: CheckoutOptions) => {
    console.log('🚀 ========== STRIPE CHECKOUT START ==========');
    console.log('📦 Input params:', { tier, billing, email });
    console.log('👤 User context:', user ? `Logged in as ${user.email}` : 'Not logged in');
    
    if (!user && !email) {
      console.error('❌ No user and no email provided');
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('⏳ Loading state set to TRUE');

    try {
      console.log('📞 Calling Supabase Edge Function: create-checkout-session');
      console.log('📤 Request body:', { tier, billing, ...(email && { email }) });
      
      const response = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: { tier, billing, ...(email && { email }) },
        }
      );

      console.log('📥 ========== RESPONSE RECEIVED ==========');
      console.log('Full response object:', response);
      console.log('✅ Success data:', response.data);
      console.log('❌ Error data:', response.error);

      if (response.error) {
        console.error('❌ Session error detected:', response.error);
        
        // The error context is a Response object, we need to read its body
        let errorMsg = 'Failed to create checkout session';
        
        if (response.error.context instanceof Response) {
          console.log('🔍 Reading error response body...');
          try {
            const errorText = await response.error.context.text();
            console.log('📄 Error response text:', errorText);
            
            // Try to parse as JSON
            try {
              const errorJson = JSON.parse(errorText);
              console.log('📋 Error response JSON:', errorJson);
              errorMsg = errorJson.error || errorJson.message || errorText;
            } catch {
              // Not JSON, use the text directly
              errorMsg = errorText || response.error.message;
            }
          } catch (readError) {
            console.error('❌ Failed to read error response:', readError);
            errorMsg = response.error.message;
          }
        } else {
          errorMsg = response.error.message;
        }
        
        console.error('📛 Final error message:', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (!response.data) {
        console.error('❌ No data returned from function');
        throw new Error('No response from server');
      }

      if (!response.data.url) {
        console.error('❌ No URL in response. Full response:', JSON.stringify(response.data, null, 2));
        throw new Error('No checkout URL returned from server');
      }

      console.log('✅ Checkout URL received:', response.data.url);
      console.log('🔄 Redirecting to Stripe Checkout...');
      
      window.location.href = response.data.url;

    } catch (err) {
      console.error('💥 ========== CHECKOUT ERROR ==========');
      console.error('Error details:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return { startCheckout, loading, error };
};
