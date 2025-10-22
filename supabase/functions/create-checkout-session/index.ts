import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  tier: 'starter' | 'professional' | 'team';
  billing: 'monthly' | 'annual';
  email?: string; // Optional email for unauthenticated users
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body first
    const { tier, billing, email: providedEmail }: CheckoutRequest = await req.json();

    if (!tier || !billing) {
      throw new Error('Missing tier or billing period');
    }

    // Get the authorization header (optional for signup flow)
    const authHeader = req.headers.get('Authorization');

    let user = null;
    let userEmail = providedEmail;

    // Try to get authenticated user if header exists
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );

      const { data: { user: authUser } } = await supabaseClient.auth.getUser();
      if (authUser) {
        user = authUser;
        userEmail = authUser.email!;
      }
    }

    // For unauthenticated users, email is required
    if (!user && !userEmail) {
      throw new Error('Email is required for checkout');
    }

    // Get price ID from environment variables
    const priceIdKey = `VITE_STRIPE_${tier.toUpperCase()}_${billing.toUpperCase()}_PRICE_ID`;
    const priceId = Deno.env.get(priceIdKey);

    if (!priceId) {
      throw new Error(`Price ID not found for ${tier} ${billing}`);
    }

    // Check if customer already exists (only for authenticated users)
    let customerId: string | undefined;

    if (user) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader! },
          },
        }
      );

      const { data: existingCustomer } = await supabaseClient
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.stripe_customer_id;
      } else {
        // Create new Stripe customer for authenticated user
        const customer = await stripe.customers.create({
          email: userEmail!,
          metadata: {
            supabase_user_id: user.id,
          },
        });

        customerId = customer.id;

        // Store customer in database
        await supabaseClient.from('stripe_customers').insert({
          user_id: user.id,
          stripe_customer_id: customer.id,
          email: userEmail!,
        });
      }
    }
    // For unauthenticated users, we'll create the customer during checkout

    // Get the origin for success and cancel URLs
    const origin = req.headers.get('origin') || 'http://localhost:5173';

    // Prepare checkout session options
    const sessionOptions: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      phone_number_collection: {
        enabled: true,
      },
    };

    // Different flow for authenticated vs unauthenticated users
    if (user && customerId) {
      // Authenticated user - use existing customer
      sessionOptions.customer = customerId;
      sessionOptions.success_url = `${origin}/app?success=true&session_id={CHECKOUT_SESSION_ID}`;
      sessionOptions.cancel_url = `${origin}/pricing?canceled=true`;
      sessionOptions.metadata = {
        user_id: user.id,
        tier,
        billing,
      };
      sessionOptions.subscription_data = {
        metadata: {
          user_id: user.id,
          tier,
          billing,
        },
      };
    } else {
      // Unauthenticated user - create new customer and trigger account creation
      sessionOptions.customer_email = userEmail;
      sessionOptions.success_url = `${origin}/signup-complete?success=true&session_id={CHECKOUT_SESSION_ID}`;
      sessionOptions.cancel_url = `${origin}/pricing?canceled=true`;
      sessionOptions.client_reference_id = userEmail; // Use email as reference
      sessionOptions.metadata = {
        tier,
        billing,
        new_signup: 'true',
        email: userEmail,
      };
      sessionOptions.subscription_data = {
        metadata: {
          tier,
          billing,
          new_signup: 'true',
        },
      };
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
