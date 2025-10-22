# Production Configuration Guide

## Environment Variables Setup

This guide helps you configure all necessary environment variables for production deployment.

### Required Environment Variables

#### 1. OpenAI Configuration
```env
VITE_OPENAI_API_KEY=sk-proj-...
OPENAI_API_KEY=sk-proj-...
```
**Where to get it:**
- Go to https://platform.openai.com/api-keys
- Create a new API key
- Copy both keys to your environment

#### 2. Supabase Configuration
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Where to get it:**
- Go to your Supabase project dashboard
- Navigate to Settings > API
- Copy the URL and anon/public key

**Additional Supabase Setup:**
- Run all database migrations from `supabase/migrations/`
- Deploy Edge Functions from `supabase/functions/`
- Configure authentication providers (Email, OAuth)

#### 3. Stripe Configuration
```env
# Stripe API Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
**Where to get it:**
- Go to https://dashboard.stripe.com/apikeys
- Copy your publishable and secret keys
- For webhook secret: Developers > Webhooks > Add endpoint

**Stripe Price IDs:**
```env
# Starter Plan
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_...

# Professional Plan
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_PRO_ANNUAL_PRICE_ID=price_...

# Team Plan
VITE_STRIPE_TEAM_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=price_...
```

**How to create products in Stripe:**
1. Go to Products > Add Product
2. Create each plan (Starter, Professional, Team)
3. Add prices for monthly and annual billing
4. Copy each price ID to your environment variables

#### 4. Application Configuration
```env
VITE_APP_URL=https://your-domain.com
VITE_ASYNC_WORKLOAD_API_KEY=your-async-workload-api-key
```

### Setting Environment Variables

#### Netlify
1. Go to Site Settings > Environment Variables
2. Add each variable from above
3. Click "Save"
4. Redeploy your site

#### Vercel
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# ... add all variables
```

#### Local Development
1. Copy `.env.example` to `.env`
2. Fill in all values
3. Never commit `.env` to version control

## Database Migrations

### Running Migrations

#### Using Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

#### Manual Migration
1. Go to Supabase Dashboard > SQL Editor
2. Run each migration file in order:
   - `20250422170738_crimson_hill.sql`
   - `20250422172105_dark_plain.sql`
   - `20250422173243_muddy_bridge.sql`
   - `20250422175711_dawn_thunder.sql`
   - `20250422181955_maroon_stream.sql`
   - `20250422182131_twilight_snowflake.sql`
   - `20250422182356_graceful_surf.sql`
   - `20250422185836_cold_morning.sql`
   - `20251022000000_add_subscriptions.sql`

## Edge Functions Deployment

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-billing-portal
supabase functions deploy chat
supabase functions deploy chat-config

# Set secrets for functions
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set VITE_APP_URL=https://your-domain.com
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

### Verify Functions
```bash
# List deployed functions
supabase functions list

# Test a function
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"priceId":"price_...", "tier":"professional", "billing":"monthly"}'
```

## Stripe Webhook Configuration

### Setup Webhook Endpoint

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Add to Supabase secrets: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

### Test Webhook

1. Go to Webhooks > Your endpoint
2. Click "Send test webhook"
3. Select an event type
4. Click "Send test webhook"
5. Check the response in the "Recent Deliveries" section

## Authentication Setup

### Email Authentication

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Email provider
3. Configure:
   - Enable email confirmations (recommended)
   - Set up custom SMTP (optional but recommended for production)

### OAuth Providers

#### Google OAuth
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

#### GitHub OAuth
1. Go to GitHub Developer Settings
2. Create new OAuth App
3. Set callback URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] Stripe webhook secret is configured
- [ ] RLS policies are enabled on all tables
- [ ] OAuth providers are configured correctly
- [ ] CORS is configured properly
- [ ] Rate limiting is enabled (if applicable)
- [ ] SSL/TLS is enabled on all endpoints
- [ ] API keys are not exposed in client code
- [ ] Database backups are configured
- [ ] Error monitoring is set up

## Testing Checklist

### Authentication
- [ ] Sign up with email works
- [ ] Email confirmation works
- [ ] Sign in with email works
- [ ] Sign in with Google OAuth works
- [ ] Sign in with GitHub OAuth works
- [ ] Password reset works
- [ ] Session persistence works

### Subscriptions
- [ ] Free tier user can access basic features
- [ ] Upgrade to Starter plan works
- [ ] Upgrade to Professional plan works
- [ ] Upgrade to Team plan works
- [ ] Billing portal access works
- [ ] Subscription cancellation works
- [ ] Usage limits are enforced correctly
- [ ] Webhooks update subscription status

### Features
- [ ] Dataset upload works
- [ ] Model training works
- [ ] API access works (for paid tiers)
- [ ] Usage dashboard shows correct data
- [ ] Upgrade prompts appear when limits reached

## Monitoring

### Set Up Error Tracking
Consider using:
- Sentry
- LogRocket
- Bugsnag

### Set Up Analytics
Consider using:
- Google Analytics
- Mixpanel
- Amplitude

### Monitor Uptime
Consider using:
- Pingdom
- UptimeRobot
- StatusCake

## Support

If you encounter issues:
1. Check the logs in Supabase Dashboard
2. Check Stripe webhook delivery logs
3. Check browser console for client-side errors
4. Review the DEPLOYMENT.md guide
5. Contact support at support@dataflowhubai.com
