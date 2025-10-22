# Stripe Setup Guide

You're almost ready! Follow these steps to complete your Stripe integration.

## Your Current Stripe Keys (Already Configured ✓)
- Publishable Key: `pk_test_51SKT0E2MMddtMstzW8IkbD2HRIta5SpR91G3XfvyAdoVkYxF1vIVWzkPPykUJkDoDtnBaEcn2v5wTpJe9H43MYIA00DwnJcJAw`
- Secret Key: `sk_test_51SKT0E2MMddtMstzIhY1lipJ0v8RQiBgBIxmrRgGzU3OvwwiYru8zflz2lAT4VlycVFgKUrMTUHh2Lh62qrBB2Pp00Odrs5Q5E`

## Step 1: Create Products in Stripe Dashboard

Go to: https://dashboard.stripe.com/test/products

### Create 3 Products:

#### Product 1: Starter Plan
- **Name:** Starter Plan
- **Description:** Perfect for individuals getting started with AI
- **Pricing:**
  - Monthly: $29/month
  - Annual: $290/year (save $58)
- **After creating, copy the Price IDs**

#### Product 2: Professional Plan
- **Name:** Professional Plan
- **Description:** Advanced features for power users
- **Pricing:**
  - Monthly: $99/month
  - Annual: $990/year (save $198)
- **After creating, copy the Price IDs**

#### Product 3: Team Plan
- **Name:** Team Plan
- **Description:** Collaboration tools for teams
- **Pricing:**
  - Monthly: $299/month
  - Annual: $2990/year (save $598)
- **After creating, copy the Price IDs**

## Step 2: Set Up Webhook (Two Options)

### Option A: Using Stripe CLI (for local testing)

1. **Fix Homebrew permissions:**
   ```bash
   sudo chown -R $(whoami) /usr/local/Cellar /usr/local/Homebrew
   brew install stripe/stripe-cli/stripe
   ```

2. **Login and forward webhooks:**
   ```bash
   stripe login
   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
   ```

3. **Copy the webhook secret** (starts with `whsec_...`) and add to `.env`

### Option B: Using Stripe Dashboard (simpler for now)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL:** Your Supabase function URL (see below for how to get it)
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. **Copy the signing secret** (starts with `whsec_...`)

## Step 3: Update Your .env File

After creating products and webhook, update `.env`:

```env
# Replace these with your actual Price IDs from Stripe Dashboard
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_TEAM_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx

# Replace with your webhook signing secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Step 4: Deploy Supabase Functions

**Run these commands on YOUR local machine (your Mac terminal):**

### Option A: Using NPM (Recommended if Homebrew has issues)

```bash
# Install Supabase CLI via npm
npm install -g supabase

# Or use npx without installing globally
npx supabase login
npx supabase link --project-ref bcobpxgktvgfsffdsiog
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy create-checkout-session
npx supabase functions deploy customer-portal
```

### Option B: Using Homebrew

```bash
# Fix permissions first
sudo chown -R $(whoami) /usr/local/Cellar /usr/local/Homebrew

# Install Supabase CLI
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref bcobpxgktvgfsffdsiog

# Deploy the webhook function
supabase functions deploy stripe-webhook --no-verify-jwt

# Deploy the checkout session function
supabase functions deploy create-checkout-session

# Deploy the customer portal function
supabase functions deploy customer-portal
```

### Option C: Using Supabase Dashboard (No CLI needed)

If you can't install the CLI, you can deploy via the dashboard:

1. Go to: https://supabase.com/dashboard/project/bcobpxgktvgfsffdsiog/functions
2. Click **"Create a new function"**
3. For each function (`stripe-webhook`, `create-checkout-session`, `customer-portal`):
   - Click **"Upload function"**
   - Upload the folder from `supabase/functions/[function-name]/`
   - Or copy/paste the code from `index.ts`
4. Click **"Deploy"**

After deployment, you'll get URLs like:
```
https://bcobpxgktvgfsffdsiog.supabase.co/functions/v1/stripe-webhook
```

**Use this URL in Step 2 Option B for the webhook endpoint!**

## Step 5: Set Secrets in Supabase

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_51SKT0E2MMddtMstzIhY1lipJ0v8RQiBgBIxmrRgGzU3OvwwiYru8zflz2lAT4VlycVFgKUrMTUHh2Lh62qrBB2Pp00Odrs5Q5E

supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

Or set them via Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/bcobpxgktvgfsffdsiog/settings/functions
2. Click **"Edge Function Secrets"**
3. Add:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

## Step 6: Test Your Setup

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Go to pricing page:** http://localhost:5173/pricing

3. **Click a plan's CTA button**

4. **Test with Stripe test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

5. **Check webhook was received:**
   - Stripe Dashboard → Webhooks → [your endpoint] → Logs
   - Or Stripe CLI output if using `stripe listen`

6. **Verify user account created:**
   - Supabase Dashboard → Authentication → Users
   - Should see new user with subscription metadata

## Troubleshooting

### Webhook signature verification failed
- Make sure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard
- Ensure you're using the test mode secret (starts with `whsec_test_...`)

### Checkout session fails to create
- Verify price IDs in `.env` match those in Stripe Dashboard
- Check that prices are active in Stripe

### User account not created after payment
- Check Supabase function logs in Dashboard
- Verify `STRIPE_SECRET_KEY` is set in Supabase secrets
- Make sure webhook events include `checkout.session.completed`

## Next Steps: Going Live

When ready for production:

1. **Switch Stripe to Live Mode**
2. **Create live products and prices**
3. **Update `.env.production` with live keys**
4. **Create live webhook endpoint** pointing to production Supabase URL
5. **Update Supabase production secrets** with live keys
6. **Test with real card** (you can refund immediately)

---

**You're ready to accept payments!** 🎉
