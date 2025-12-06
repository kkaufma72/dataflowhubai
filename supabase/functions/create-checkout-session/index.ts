import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  tier: 'starter' | 'professional' | 'team';
  billing: 'monthly' | 'annual';
  email?: string;
}

serve(async (req) => {
  console.log('🚀 Checkout function invoked');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });
    
    console.log('✅ Stripe initialized');

    // Parse request body
    const { tier, billing, email }: CheckoutRequest = await req.json();
    console.log('📦 Request:', { tier, billing, email });

    if (!tier || !billing) {
      throw new Error('Missing tier or billing period');
    }

    if (!email) {
      throw new Error('Email is required for checkout');
    }

    // Get price ID from environment variables
    const priceIdKey = `VITE_STRIPE_${tier.toUpperCase()}_${billing.toUpperCase()}_PRICE_ID`;
    const priceId = Deno.env.get(priceIdKey);
    
    console.log('🔑 Looking for price ID:', priceIdKey);
    console.log('💰 Found price ID:', priceId ? 'Yes' : 'No');

    if (!priceId) {
      throw new Error(`Price ID not found for ${tier} ${billing}. Expected env var: ${priceIdKey}`);
    }

    // Get the origin for success and cancel URLs
    const origin = req.headers.get('origin') || 'http://localhost:5173';
    console.log('🌐 Origin:', origin);

    // Create checkout session (simplified - no customer lookup)
    console.log('💳 Creating Stripe checkout session...');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: email,
      allow_promotion_codes: true,
      success_url: `${origin}/app?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        tier,
        billing,
        email,
      },
      subscription_data: {
        metadata: {
          tier,
          billing,
        },
      },
    });

    console.log('✅ Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
