# Stripe Integration Setup Guide

This guide will help you set up the complete Stripe payment integration for DataFlowHub AI.

## Overview

The Stripe integration includes:
- ✅ Subscription-based checkout with Stripe Checkout
- ✅ Webhook handling for payment events
- ✅ Customer portal for subscription management
- ✅ Database schema for tracking subscriptions
- ✅ Real-time subscription status updates
- ✅ Support for monthly and annual billing
- ✅ Three pricing tiers: Free, Professional ($99/mo), Team ($299/mo)

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Supabase project set up
3. Access to your Supabase project's environment variables

## Step 1: Create Stripe Products and Prices

### 1.1 Log in to Stripe Dashboard

Go to https://dashboard.stripe.com and log in to your account.

### 1.2 Create Products

Navigate to **Products** in the left sidebar and create three products:

#### Professional Plan
- **Name**: Professional Plan
- **Description**: Advanced ML features with priority support
- **Pricing**:
  - Monthly: $99/month (recurring)
  - Annual: $990/year (recurring) - This is $82.50/month, 17% savings

#### Team Plan
- **Name**: Team Plan
- **Description**: Everything in Pro plus team collaboration
- **Pricing**:
  - Monthly: $299/month (recurring)
  - Annual: $2990/year (recurring) - This is $249.17/month, 17% savings

#### Starter Plan (Optional - currently free tier)
- **Name**: Starter Plan
- **Description**: Basic features for individuals
- **Pricing**:
  - Monthly: $0/month (or create a paid tier if desired)

### 1.3 Copy Price IDs

After creating each price, copy the Price ID (starts with `price_`). You'll need these for your environment variables.

## Step 2: Configure Environment Variables

Update your `.env` file with the Stripe credentials:

```bash
# Stripe Keys (from Stripe Dashboard -> Developers -> API Keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Price IDs (from Step 1.3)
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_TEAM_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx

# Optional: Starter Plan (if using paid starter tier)
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx

# Webhook Secret (you'll get this in Step 4)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### For Supabase Edge Functions

You also need to set these as Supabase secrets:

```bash
# Set Supabase secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Set Price IDs
supabase secrets set VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
supabase secrets set VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx
supabase secrets set VITE_STRIPE_TEAM_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
supabase secrets set VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx
```

## Step 3: Deploy Database Migrations

Run the Stripe subscription migration:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration directly in Supabase Dashboard -> SQL Editor
# Copy and paste the contents of: supabase/migrations/20251022000000_stripe_subscriptions.sql
```

This creates the following tables:
- `stripe_customers` - Maps users to Stripe customer IDs
- `subscriptions` - Tracks active subscriptions
- `payment_history` - Records all payments

## Step 4: Deploy Supabase Edge Functions

### 4.1 Deploy the Functions

```bash
# Deploy checkout session function
supabase functions deploy create-checkout-session

# Deploy webhook handler
supabase functions deploy stripe-webhook

# Deploy customer portal function
supabase functions deploy create-customer-portal
```

### 4.2 Get the Webhook URL

After deploying the webhook function, get its URL:

```bash
supabase functions list
```

The webhook URL will be something like:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

## Step 5: Configure Stripe Webhooks

### 5.1 Create Webhook Endpoint

1. Go to **Stripe Dashboard** -> **Developers** -> **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL from Step 4.2
4. Select the following events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

5. Click **Add endpoint**

### 5.2 Get Webhook Secret

After creating the webhook:
1. Click on the webhook you just created
2. Click **Reveal** next to "Signing secret"
3. Copy the webhook secret (starts with `whsec_`)
4. Update your `.env` file and Supabase secrets:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Also update Supabase secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Step 6: Enable Stripe Customer Portal

1. Go to **Stripe Dashboard** -> **Settings** -> **Billing** -> **Customer portal**
2. Click **Activate**
3. Configure the portal settings:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to update billing information
   - ✅ Allow customers to cancel subscriptions
   - ✅ Show pricing table
4. Save changes

## Step 7: Test the Integration

### 7.1 Test Checkout Flow

1. Navigate to the pricing page: `http://localhost:5173/pricing`
2. Click on a paid plan (Professional or Team)
3. Toggle between Monthly and Annual billing
4. Click "Start Free Trial"
5. You should be redirected to Stripe Checkout

### 7.2 Use Test Cards

Stripe provides test cards for testing:

**Successful Payment:**
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Payment Requires Authentication:**
- Card number: `4000 0025 0000 3155`

**Declined Payment:**
- Card number: `4000 0000 0000 9995`

### 7.3 Verify Webhook Events

After completing a test checkout:
1. Go to **Stripe Dashboard** -> **Developers** -> **Webhooks**
2. Click on your webhook endpoint
3. Check the **Events** tab to see received events
4. Verify that events were successfully processed

### 7.4 Check Database

After successful checkout, verify data in Supabase:

```sql
-- Check stripe_customers table
SELECT * FROM stripe_customers;

-- Check subscriptions table
SELECT * FROM subscriptions WHERE status = 'active';

-- Check payment_history
SELECT * FROM payment_history ORDER BY created_at DESC;
```

## Step 8: Test Customer Portal

1. After subscribing, go to the dashboard
2. The `SubscriptionStatus` component should show your active subscription
3. Click "Manage Subscription"
4. You should be redirected to Stripe Customer Portal
5. Test updating payment method, viewing invoices, and canceling subscription

## Usage in Your Application

### Display Subscription Status

Add the subscription status component to your dashboard:

```tsx
import { SubscriptionStatus } from '../components/SubscriptionStatus';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <SubscriptionStatus />
    </div>
  );
}
```

### Check Subscription in Code

Use the `useSubscription` hook to check subscription status:

```tsx
import { useSubscription } from '../hooks/useSubscription';

function ProtectedFeature() {
  const { hasActiveSubscription, subscription, loading } = useSubscription();

  if (loading) return <div>Loading...</div>;

  if (!hasActiveSubscription) {
    return <div>Please upgrade to access this feature</div>;
  }

  return <div>Premium feature content</div>;
}
```

### Trigger Checkout

Use the `useStripeCheckout` hook:

```tsx
import { useStripeCheckout } from '../hooks/useStripeCheckout';

function UpgradeButton() {
  const { startCheckout, loading } = useStripeCheckout();

  return (
    <button
      onClick={() => startCheckout({ tier: 'professional', billing: 'monthly' })}
      disabled={loading}
    >
      Upgrade to Pro
    </button>
  );
}
```

### Open Customer Portal

Use the `useCustomerPortal` hook:

```tsx
import { useCustomerPortal } from '../hooks/useCustomerPortal';

function ManageSubscriptionButton() {
  const { openPortal, loading } = useCustomerPortal();

  return (
    <button onClick={openPortal} disabled={loading}>
      Manage Subscription
    </button>
  );
}
```

## Production Deployment

### Before Going Live:

1. **Switch to Live Mode in Stripe**
   - Get live API keys from Stripe Dashboard
   - Update all environment variables with live keys
   - Update webhook URL to production URL
   - Create live products and prices

2. **Update Environment Variables**
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   ```

3. **Security Checklist**
   - ✅ Never commit `.env` files to git
   - ✅ Use Supabase secrets for sensitive keys
   - ✅ Enable Row Level Security on all tables (already done)
   - ✅ Verify webhook signature validation is working
   - ✅ Test all payment flows in production

4. **Configure Production Webhook**
   - Create new webhook endpoint with production URL
   - Select same events as test webhook
   - Update `STRIPE_WEBHOOK_SECRET` with new secret

## Troubleshooting

### Issue: Checkout redirects to 404
**Solution**: Verify the Supabase function is deployed and the correct URL is being used.

### Issue: Webhooks not being received
**Solution**:
- Check webhook URL is correct and publicly accessible
- Verify webhook events are selected in Stripe Dashboard
- Check Supabase function logs: `supabase functions logs stripe-webhook`

### Issue: "No price found" error
**Solution**: Verify all price IDs are set correctly in environment variables and Supabase secrets.

### Issue: Subscription not showing in database
**Solution**:
- Check webhook handler logs
- Verify webhook secret is correct
- Ensure database migration was applied successfully

## Support

For issues or questions:
- Stripe Documentation: https://stripe.com/docs
- Supabase Documentation: https://supabase.com/docs
- Project Issues: [Your GitHub repo]

## Summary

You now have a complete Stripe integration with:
- ✅ Subscription checkout
- ✅ Webhook handling
- ✅ Customer portal
- ✅ Subscription management
- ✅ Real-time updates
- ✅ Payment history tracking

All features are production-ready and follow Stripe best practices!
