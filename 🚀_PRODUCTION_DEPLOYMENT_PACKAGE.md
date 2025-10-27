# 🚀 PRODUCTION DEPLOYMENT PACKAGE - Everything You Need

## ✅ **READY TO DEPLOY! Follow This Exact Sequence:**

**Total Time:** 1 hour  
**Difficulty:** Easy (copy/paste steps)  
**Result:** Fully operational production site  

---

## 📋 **PART 1: SUPABASE CONFIGURATION (10 minutes)**

### **Step 1.1: Disable Email Confirmation**

```
1. Go to: https://app.supabase.com
2. Select project: bcobpxgktvgfsffdsiog
3. Authentication → Settings
4. Find: "Enable email confirmations"
5. Turn OFF
6. Save
```

**Why:** Users can sign up and use immediately (no SMTP needed for beta)

---

### **Step 1.2: Apply Database Migrations**

**Go to:** SQL Editor in Supabase

**Run Migration 1:** Conversations Table
```sql
-- Copy/paste entire file:
-- supabase/migrations/20251026_conversations_table.sql

-- Click Run
-- Should see: Success
```

**Run Migration 2:** User Profile Trigger
```sql
-- Copy/paste entire file:
-- supabase/migrations/20251027_fix_user_profile_creation.sql

-- Click Run
-- Should see: Success
```

**Verify Tables:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should see: conversations, user_profiles, datasets, models, etc.
```

---

### **Step 1.3: Configure URLs**

**Authentication → URL Configuration:**

```
Site URL:
https://dataflowhub.ai

Redirect URLs (add these):
https://dataflowhub.ai/*
https://dataflowhub.ai/signin
https://dataflowhub.ai/app
https://dataflowhub.ai/app/auth/callback
```

**Save**

---

## 📋 **PART 2: STRIPE SETUP (15 minutes)**

### **Step 2.1: Get Stripe API Keys**

**Go to:** https://dashboard.stripe.com/test/apikeys

**Copy:**
- Publishable key: `pk_test_...`
- Secret key: `sk_test_...`

**Save these** - you'll need them!

---

### **Step 2.2: Create Products & Prices**

**Option A: Use Script (Recommended)**

```bash
cd /Users/kyledev/.cursor/worktrees/dataflowhubai/1761513161175-2c8b87

# Add your Stripe secret key to .env first:
echo "STRIPE_SECRET_KEY=sk_test_your_key_here" >> .env

# Run setup script:
node scripts/setup-stripe-products.mjs

# Copy the price IDs it generates!
```

**Option B: Create Manually**

1. Go to: https://dashboard.stripe.com/test/products
2. Click "+ Add product"
3. Create "Professional Plan":
   - Name: Professional Plan
   - Description: Unlimited datasets, AI chat, advanced analytics
   - Price: $49/month (recurring)
   - Add another price: $468/year (save price ID!)
4. Create "Team Plan":
   - Name: Team Plan
   - Description: Everything in Pro + team features
   - Price: $149/month
   - Add another price: $1,428/year
5. **Save all 4 price IDs!**

---

### **Step 2.3: Configure Webhook**

**Go to:** https://dashboard.stripe.com/test/webhooks

**Click:** "+ Add endpoint"

**Endpoint URL:**
```
https://bcobpxgktvgfsffdsiog.supabase.co/functions/v1/stripe-webhook
```

**Events to send:**
```
✓ customer.subscription.created
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.paid
✓ invoice.payment_failed
✓ checkout.session.completed
```

**Click:** "Add endpoint"

**Copy webhook secret:** `whsec_...`

---

## 📋 **PART 3: VERCEL ENVIRONMENT VARIABLES (15 minutes)**

### **Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add ALL of these:**

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://bcobpxgktvgfsffdsiog.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb2JweGdrdHZnZnNmZmRzaW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDE1NDQsImV4cCI6MjA3NjQxNzU0NH0.xI0sbMYLa7ln-XcbESHr4Y9tLNzg_LLkZAySj0O5a04

# OpenAI (Required)
VITE_OPENAI_API_KEY=***REVOKED-KEY-DO-NOT-USE***

# Stripe (Required for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_[your_key]
STRIPE_SECRET_KEY=sk_test_[your_key]
STRIPE_WEBHOOK_SECRET=whsec_[your_webhook_secret]

# Stripe Price IDs (from setup script or dashboard)
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_[generated]
VITE_STRIPE_PRO_ANNUAL_PRICE_ID=price_[generated]
VITE_STRIPE_TEAM_MONTHLY_PRICE_ID=price_[generated]
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=price_[generated]

# Feature Flags
VITE_ENABLE_STRIPE=true
```

**Important:** Check boxes for **Production, Preview, AND Development!**

**Then:** Click "Redeploy" from Deployments tab

---

## 📋 **PART 4: TEST EVERYTHING (20 minutes)**

### **Test 1: Signup Flow** ✅
```
1. Go to: https://dataflowhub.ai/signin
2. Click "Sign up"
3. Fill all fields (including Use Case!)
4. Create account
5. Sign in immediately
6. See dashboard
✓ Should work
```

### **Test 2: Upload Dataset** ✅
```
1. Go to: /app/data
2. Upload CSV file
3. See health score badge (🟢 92 A)
4. Click "Ask AI"
5. Get personalized response
✓ Should work
```

### **Test 3: Transform Studio** ✅
```
1. Click "✨ Transform with AI"
2. Type: "Remove rows where price < 100"
3. See transformation
4. Save
✓ Should work
```

### **Test 4: Stripe Payment** 💳
```
1. Go to: /pricing
2. Click "Start Free Trial" on Pro ($49)
3. Enter test card: 4242 4242 4242 4242
4. Expiry: 12/25, CVC: 123, ZIP: 12345
5. Complete payment
6. Should redirect back
7. Check Stripe Dashboard → Customers
8. Should see new customer with subscription
✓ Should work
```

### **Test 5: Magic Moment** ✅
```
1. Create new account
2. Login
3. Wait 1 second
4. Magic Moment modal appears
5. Click sample dataset
6. See insights!
✓ Should work
```

---

## 📋 **PART 5: FINAL CHECKLIST (5 minutes)**

### **Before Launch:**

**Supabase:**
- [ ] Email confirmation: OFF
- [ ] Redirect URLs: Added
- [ ] Database migrations: Applied (3 total)
- [ ] Tables exist: user_profiles, conversations, subscriptions
- [ ] RLS policies: Enabled

**Stripe:**
- [ ] Products created: Pro ($49), Team ($149)
- [ ] Prices created: Monthly + Annual for each
- [ ] Webhook configured
- [ ] Test payment works
- [ ] Price IDs in environment variables

**Vercel:**
- [ ] All environment variables set (13 total)
- [ ] Variables applied to: Production, Preview, Development
- [ ] Latest code deployed
- [ ] Build successful
- [ ] Site loads without errors

**Testing:**
- [ ] Signup works
- [ ] Login works
- [ ] Dashboard loads
- [ ] Upload dataset works
- [ ] AI chat works
- [ ] Transform Studio works
- [ ] Payment flow works (test mode)
- [ ] Mobile responsive

**Content:**
- [ ] Pricing page shows: Free/$49/$149
- [ ] Landing page: Interactive demos work
- [ ] Support email: support@dataflowhub.ai

---

## 🎯 **QUICK START COMMANDS:**

### **Run These in Order:**

```bash
# 1. Navigate to project
cd /Users/kyledev/.cursor/worktrees/dataflowhubai/1761513161175-2c8b87

# 2. Make sure STRIPE_SECRET_KEY in .env
echo "STRIPE_SECRET_KEY=sk_test_YOUR_KEY" >> .env

# 3. Run Stripe setup
node scripts/setup-stripe-products.mjs

# 4. Copy the price IDs it outputs
# 5. Add them to Vercel environment variables
# 6. Redeploy from Vercel dashboard

# 7. Test!
```

---

## 📊 **ENVIRONMENT VARIABLES COMPLETE LIST:**

Copy this checklist and verify each one in Vercel:

```
Supabase:
✓ VITE_SUPABASE_URL
✓ VITE_SUPABASE_ANON_KEY

OpenAI:
✓ VITE_OPENAI_API_KEY

Stripe:
✓ VITE_STRIPE_PUBLISHABLE_KEY
✓ STRIPE_SECRET_KEY
✓ STRIPE_WEBHOOK_SECRET
✓ VITE_STRIPE_PRO_MONTHLY_PRICE_ID
✓ VITE_STRIPE_PRO_ANNUAL_PRICE_ID
✓ VITE_STRIPE_TEAM_MONTHLY_PRICE_ID
✓ VITE_STRIPE_TEAM_ANNUAL_PRICE_ID

Feature Flags:
✓ VITE_ENABLE_STRIPE=true

Optional (add later):
○ VITE_POSTHOG_KEY
○ VITE_SENTRY_DSN
```

**Total:** 13 required variables

---

## 🎊 **YOU'RE READY WHEN:**

✅ All 13 environment variables set  
✅ Stripe products created  
✅ Stripe webhook configured  
✅ Database migrations applied  
✅ Supabase email confirmation OFF  
✅ Test signup works  
✅ Test payment works (with test card)  
✅ Site loads on https://dataflowhub.ai  

**Then:** You're LIVE and ready for customers! 🚀

---

## 🚀 **NEXT STEPS:**

**I'll now:**
1. ✅ Commit these Stripe/pricing updates
2. ✅ Push to production
3. ✅ Create final launch checklist
4. ✅ Give you step-by-step deployment guide

**You'll:**
1. Run Stripe setup script
2. Add environment variables
3. Test payment flow
4. LAUNCH! 🎉

---

**Let me commit these changes and create your final deployment guide!** 💪

