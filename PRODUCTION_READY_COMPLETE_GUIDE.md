# 🚀 PRODUCTION READY - Complete Implementation Guide

## ✅ **Get Everything Production-Ready in 1 Hour**

This guide covers:
1. Stripe setup ($49/$149 pricing)
2. Database migrations
3. Environment variables
4. Monitoring & analytics
5. Testing
6. Launch!

---

## 📋 **PART 1: STRIPE SETUP (20 minutes)**

### **Step 1: Update Stripe Products**

Your current pricing:
- ❌ Old: $29/$99/$299
- ✅ New: Free/$49/$149/Custom

**Update pricing script:**

File: `scripts/setup-stripe-products.mjs`

Change products to:
```javascript
const PRODUCTS = [
  {
    name: 'Professional Plan',
    description: 'Unlimited datasets, AI chat, and advanced analytics',
    prices: [
      { amount: 4900, interval: 'month', nickname: 'Pro Monthly' },  // $49/mo
      { amount: 46800, interval: 'year', nickname: 'Pro Annual' }    // $39/mo billed annually
    ]
  },
  {
    name: 'Team Plan',
    description: 'Everything in Pro plus team collaboration',
    prices: [
      { amount: 14900, interval: 'month', nickname: 'Team Monthly' }, // $149/mo
      { amount: 142800, interval: 'year', nickname: 'Team Annual' }   // $119/mo billed annually
    ]
  }
];
```

**Run setup:**
```bash
# Make sure you have STRIPE_SECRET_KEY in .env
node scripts/setup-stripe-products.mjs

# Copy the price IDs it generates
# Add to your .env and Vercel environment variables
```

---

### **Step 2: Configure Stripe Webhook**

**In Stripe Dashboard:**

1. **Go to:** https://dashboard.stripe.com/test/webhooks
2. **Click:** "+ Add endpoint"
3. **Endpoint URL:**
   ```
   https://bcobpxgktvgfsffdsiog.supabase.co/functions/v1/stripe-webhook
   ```

4. **Description:** "DataFlowHub Subscription Events"

5. **Events to send:** Select these:
   ```
   ✓ customer.subscription.created
   ✓ customer.subscription.updated
   ✓ customer.subscription.deleted
   ✓ invoice.paid
   ✓ invoice.payment_failed
   ✓ checkout.session.completed
   ```

6. **Click:** "Add endpoint"

7. **Copy webhook signing secret:** `whsec_...`

8. **Add to environment variables**

---

### **Step 3: Test Stripe Checkout**

**Using Stripe test mode:**

```
Test Card Numbers:
• Success: 4242 4242 4242 4242
• Decline: 4000 0000 0000 0002
• 3D Secure: 4000 0025 0000 3155

Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Test flow:**
1. Go to /pricing
2. Click "Start free trial" on Pro plan
3. Fill test card details
4. Complete checkout
5. Should redirect back with success
6. User should have Pro subscription

---

## 📋 **PART 2: DATABASE SETUP (15 minutes)**

### **Step 1: Apply All Migrations**

**In Supabase Dashboard → SQL Editor:**

Run these in order:

**Migration 1: Conversations Table**
```sql
-- Paste contents of:
supabase/migrations/20251026_conversations_table.sql

-- Click Run
```

**Migration 2: User Profile Trigger**
```sql
-- Paste contents of:
supabase/migrations/20251027_fix_user_profile_creation.sql

-- Click Run
```

**Migration 3: Stripe Subscriptions** (if not already applied)
```sql
-- Check if subscription tables exist:
SELECT * FROM subscriptions LIMIT 1;

-- If error, apply:
supabase/migrations/20251022000000_stripe_subscriptions.sql
```

---

### **Step 2: Verify Tables Exist**

**Run this query:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profiles',
  'conversations',
  'subscriptions',
  'datasets',
  'models',
  'projects'
);
```

**Should return all 6 tables** ✅

---

### **Step 3: Check RLS Policies**

**Make sure Row Level Security is configured:**

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All should show rowsecurity = true
```

---

## 📋 **PART 3: ENVIRONMENT VARIABLES (10 minutes)**

### **Vercel Production Variables:**

**Go to:** Vercel Dashboard → Settings → Environment Variables

**Add/Verify ALL these:**

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://bcobpxgktvgfsffdsiog.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (Required)
VITE_OPENAI_API_KEY=sk-proj-...

# Stripe (Required for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_ for testing)
STRIPE_SECRET_KEY=sk_live_... (or sk_test_ for testing)
STRIPE_WEBHOOK_SECRET=whsec_... (from webhook setup)

# Stripe Price IDs (from setup script)
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_PRO_ANNUAL_PRICE_ID=price_...
VITE_STRIPE_TEAM_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=price_...

# Analytics (Optional but recommended)
VITE_POSTHOG_KEY=phc_... (if you setup PostHog)
VITE_SENTRY_DSN=https://... (if you setup Sentry)

# Feature Flags
VITE_ENABLE_STRIPE=true
VITE_ENABLE_ANALYTICS=true
```

**Important:** Check boxes for Production, Preview, AND Development!

---

## 📋 **PART 4: SUPABASE PRODUCTION CONFIG (5 minutes)**

### **Authentication Settings:**

**Go to:** Supabase Dashboard → Authentication → Settings

**Configure:**
```
✓ Enable email provider: ON
✓ Enable signup: ON
❌ Enable email confirmations: OFF (for beta)
   → Can enable later with SMTP

Site URL (Production):
https://dataflowhub.ai

Redirect URLs (add both):
https://dataflowhub.ai/*
https://dataflowhub.ai/signin
https://dataflowhub.ai/app/auth/callback
```

**Save**

---

### **API Settings:**

**Go to:** Settings → API

**Check:**
- Project URL: Correct
- Anon (public) key: Matches your env var
- Service role key: Secure, not exposed

---

## 📋 **PART 5: MONITORING SETUP (10 minutes)**

### **Option A: Sentry (Error Tracking)**

**Quick Setup:**

```bash
npm install @sentry/react @sentry/tracing
```

**In src/main.tsx:**
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});

// Wrap app
<Sentry.ErrorBoundary fallback={ErrorFallback}>
  <App />
</Sentry.ErrorBoundary>
```

**Get DSN:**
1. Create account: https://sentry.io
2. Create project: "DataFlowHub"
3. Copy DSN
4. Add to Vercel env vars

---

### **Option B: PostHog (Analytics)**

**Quick Setup:**

```bash
npm install posthog-js
```

**In src/lib/analytics.ts:**
```typescript
import posthog from 'posthog-js';

export const initAnalytics = () => {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      autocapture: true
    });
  }
};

// Track events
export const track = (event: string, properties?: any) => {
  posthog.capture(event, properties);
};
```

**Get API Key:**
1. Create account: https://posthog.com
2. Create project
3. Copy API key
4. Add to Vercel env vars

---

## 📋 **PART 6: FINAL TESTING (10 minutes)**

### **Critical User Flows to Test:**

#### **Flow 1: Signup → Dashboard**
```
1. Visit: https://dataflowhub.ai
2. Click "Get started"
3. Fill signup form
4. Create account
5. Sign in
6. See dashboard
✓ Works
```

#### **Flow 2: Upload → Analyze**
```
1. Go to Data page
2. Upload CSV
3. See health score
4. Click "Ask AI"
5. Get response
✓ Works
```

#### **Flow 3: Transform Data**
```
1. Find dataset
2. Click "✨ Transform with AI"
3. Type: "Remove rows where price < 50"
4. See transformation
5. Save
✓ Works
```

#### **Flow 4: Upgrade to Pro**
```
1. Go to /pricing
2. Click Pro plan
3. Enter test card: 4242 4242 4242 4242
4. Complete checkout
5. Return to site
6. Check subscription status
✓ Works
```

#### **Flow 5: Voice Input**
```
1. Open AI chat
2. Click mic
3. Speak question
4. Get response
✓ Works
```

---

## 📋 **PART 7: PRODUCTION CHECKLIST**

### **Before Going Live:**

**Technical:**
- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Stripe products created ($49/$149)
- [ ] Stripe webhook configured
- [ ] Test payment flow works
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics setup (PostHog)
- [ ] Build succeeds without errors
- [ ] No console errors on site

**Content:**
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Support email setup (support@dataflowhub.ai)
- [ ] Landing page copy finalized
- [ ] Pricing page updated ($49/$149)
- [ ] FAQ section added

**Auth:**
- [ ] Email confirmation: OFF (for beta)
- [ ] Supabase redirect URLs configured
- [ ] OAuth providers tested (if using)
- [ ] Password requirements enforced

**Testing:**
- [ ] Signup flow tested
- [ ] Login flow tested
- [ ] Payment flow tested (test mode)
- [ ] All major features tested
- [ ] Mobile responsive checked
- [ ] Browser compatibility (Chrome, Firefox, Safari)

---

## 🚀 **LAUNCH SEQUENCE:**

### **Day 1 (Today):**
```
Morning:
✓ Run Stripe setup script
✓ Configure webhook
✓ Apply database migrations
✓ Set all environment variables
✓ Test everything

Afternoon:
✓ Final smoke test
✓ Deploy to production
✓ Verify live site works
✓ Prepare launch posts
```

### **Day 2 (Launch Day):**
```
Morning:
✓ Product Hunt post (7 AM PT)
✓ Tweet announcement
✓ LinkedIn post
✓ Reddit posts (r/SideProject, r/datascience)

Afternoon:
✓ Respond to comments
✓ Monitor signups
✓ Fix any critical bugs
✓ Thank early users

Evening:
✓ Check metrics
✓ Celebrate! 🎉
```

---

## 🎯 **WHAT TO DO RIGHT NOW:**

I'll help you implement each part. Let's start with the most critical:

**Priority 1: Stripe Products**
- Update pricing to $49/$149
- Create products in Stripe
- Get price IDs

**Priority 2: Environment Variables**
- Add all Stripe vars to Vercel
- Verify Supabase vars
- Redeploy

**Priority 3: Database**
- Apply 3 migrations
- Test data saves correctly

**Priority 4: Testing**
- Test signup
- Test payment (with test card)
- Verify everything works

**Priority 5: Monitoring** (optional for launch)
- Add Sentry
- Add PostHog
- Track errors and usage

---

**Ready to implement? Let's do this!** 🚀

**Should I:**
1. Update the Stripe setup script first?
2. Create a complete env var checklist?
3. Write step-by-step migration guide?
4. All of the above?

**Let me know and I'll execute!** 💪

