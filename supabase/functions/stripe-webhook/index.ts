import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log(`Received event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session:', session.id);

  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier;
  const billing = session.metadata?.billing;
  const isNewSignup = session.metadata?.new_signup === 'true';
  const email = session.metadata?.email || session.customer_email;

  if (!tier || !billing) {
    console.error('Missing tier or billing in checkout session');
    return;
  }

  // Handle new signups (unauthenticated users)
  if (isNewSignup && email) {
    console.log('New signup detected for:', email);

    try {
      // Create user account in Supabase
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false, // Require email confirmation
        user_metadata: {
          tier,
          billing,
          signup_via_stripe: true,
          stripe_customer_id: session.customer,
        },
      });

      if (authError) {
        console.error('Error creating user:', authError);
        return;
      }

      console.log('User created:', authData.user.id);

      // Send password setup email
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          tier,
          billing,
        },
      });

      if (inviteError) {
        console.error('Error sending invite email:', inviteError);
      }

      // Store Stripe customer mapping
      await supabaseAdmin.from('stripe_customers').insert({
        user_id: authData.user.id,
        stripe_customer_id: session.customer as string,
        email,
      });

      // Get the subscription and store it
      if (session.subscription && typeof session.subscription === 'string') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        // Store subscription with the new user's ID
        await supabaseAdmin.from('subscriptions').insert({
          user_id: authData.user.id,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0].price.id,
          status: subscription.status,
          tier,
          billing_period: billing,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        });

        console.log('Subscription created for new user');
      }
    } catch (error) {
      console.error('Error handling new signup:', error);
    }

    return;
  }

  // Handle existing authenticated users
  if (!userId) {
    console.error('Missing user_id for authenticated user checkout');
    return;
  }

  // Get the subscription
  if (session.subscription && typeof session.subscription === 'string') {
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    await handleSubscriptionUpdate(subscription);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('Updating subscription:', subscription.id);

  const userId = subscription.metadata?.user_id;
  const tier = subscription.metadata?.tier;
  const billing = subscription.metadata?.billing;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0].price.id,
    status: subscription.status,
    tier: tier || 'professional',
    billing_period: billing || 'monthly',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  };

  // Upsert subscription
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('Error upserting subscription:', error);
  } else {
    console.log('Subscription updated successfully');
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Deleting subscription:', subscription.id);

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription status:', error);
  } else {
    console.log('Subscription marked as canceled');
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Processing paid invoice:', invoice.id);

  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) {
    console.error('No customer ID in invoice');
    return;
  }

  // Get user_id from customer
  const { data: customer } = await supabaseAdmin
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!customer) {
    console.error('Customer not found in database');
    return;
  }

  // Record payment
  const { error } = await supabaseAdmin
    .from('payment_history')
    .insert({
      user_id: customer.user_id,
      stripe_customer_id: customerId,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : invoice.payment_intent?.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      description: invoice.description || `Invoice ${invoice.number}`,
    });

  if (error) {
    console.error('Error recording payment:', error);
  } else {
    console.log('Payment recorded successfully');
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing failed invoice payment:', invoice.id);

  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) {
    console.error('No customer ID in invoice');
    return;
  }

  // Get user_id from customer
  const { data: customer } = await supabaseAdmin
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!customer) {
    console.error('Customer not found in database');
    return;
  }

  // Record failed payment
  const { error } = await supabaseAdmin
    .from('payment_history')
    .insert({
      user_id: customer.user_id,
      stripe_customer_id: customerId,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : invoice.payment_intent?.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      description: invoice.description || `Failed invoice ${invoice.number}`,
    });

  if (error) {
    console.error('Error recording failed payment:', error);
  } else {
    console.log('Failed payment recorded successfully');
  }

  // Update subscription status to past_due if applicable
  if (invoice.subscription) {
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription.id;

    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subscriptionId);
  }
}
