# 💳 STRIPE LIVE MODE SETUP - Go from Test to Production

**Current Status**: 🟡 Test Mode (Sandbox)  
**Goal**: 🟢 Live Mode (Accept Real Payments)  
**Time**: 15-20 minutes

---

## 🎯 **STEP-BY-STEP GUIDE**

### **Step 1: Activate Your Stripe Account** (5 min)

```bash
1. Go to: https://dashboard.stripe.com

2. Look for banner: "Activate your account to process live payments"

3. Click "Activate Account"

4. Fill in required info:
   ✓ Business details (name, type, description)
   ✓ Personal details (name, DOB, address, SSN)
   ✓ Bank account (for payouts)
   ✓ Tax information

5. Submit for review

6. Wait for approval (usually instant-24 hours)
   - You'll get email: "Your Stripe account is activated!"
```

**Note**: You can set up live mode BEFORE activation, but can't accept real payments until approved.

---

### **Step 2: Get Live API Keys** (2 min)

```bash
1. Go to: https://dashboard.stripe.com/apikeys

2. Toggle to: "Live mode" (top right corner)
   🟢 Should show "Viewing live data"

3. Find your keys:
   - Publishable key: pk_live_xxxxx
   - Secret key: sk_live_xxxxx (click "Reveal")

4. Copy both keys (you'll need them next)
```

**IMPORTANT**: Keep secret key SECURE! Never commit to git!

---

### **Step 3: Create Live Products & Prices** (5 min)

You have 2 options:

#### **Option A: Use the Setup Script** (Easiest - 2 min)

```bash
# 1. Update .env with LIVE secret key (temporarily)
# Open .env file
# Replace: STRIPE_SECRET_KEY=sk_test_xxx
# With: STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY

# 2. Run setup script
npm run stripe:setup

# 3. Script will create products and output price IDs
# Copy the price IDs it generates
```

#### **Option B: Manual Setup** (Via Stripe Dashboard - 5 min)

```bash
1. Go to: https://dashboard.stripe.com/products

2. Toggle to "Live mode" 🟢

3. Click "Add product"

4. Create 3 products:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT 1: Starter Plan
Name: Starter Plan
Description: Perfect for individuals getting started
Pricing:
  - Monthly: $25/month
  - Annual: $249/year ($20.75/month - save 17%)
Recurring: Yes
Currency: USD

Click "Save product"
Copy Monthly Price ID: price_xxxxx
Copy Annual Price ID: price_xxxxx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRODUCT 2: Professional Plan
Name: Professional Plan  
Description: Unlimited datasets, voice control, AI copilot
Pricing:
  - Monthly: $49/month
  - Annual: $489/year ($40.75/month - save 17%)
Recurring: Yes
Currency: USD

Click "Save product"
Copy Monthly Price ID: price_xxxxx
Copy Annual Price ID: price_xxxxx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRODUCT 3: Team Plan
Name: Team Plan
Description: Everything in Pro + team collaboration
Pricing:
  - Monthly: $149/month
  - Annual: $1,489/year ($124/month - save 17%)
Recurring: Yes
Currency: USD

Click "Save product"
Copy Monthly Price ID: price_xxxxx
Copy Annual Price ID: price_xxxxx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **Step 4: Update Environment Variables** (3 min)

**Update your .env file** (CRITICAL - don't skip!):

```bash
# REPLACE test keys with live keys:

# Old (test mode):
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SHVnM...
STRIPE_SECRET_KEY=sk_test_51SHVnM...

# New (live mode):
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY

# Price IDs (from Step 3):
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_YOUR_STARTER_MONTHLY
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_YOUR_STARTER_ANNUAL
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_YOUR_PRO_MONTHLY
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_YOUR_PRO_ANNUAL
VITE_STRIPE_TEAM_MONTHLY_PRICE_ID=price_YOUR_TEAM_MONTHLY
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=price_YOUR_TEAM_ANNUAL
```

**SAVE THE FILE!**

---

### **Step 5: Update Vercel Environment Variables** (5 min)

```bash
1. Go to: https://vercel.com/dashboard

2. Select your project (dataflowhubai)

3. Go to: Settings → Environment Variables

4. Add/Update these variables:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Variable Name                              | Value
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VITE_STRIPE_PUBLISHABLE_KEY               | pk_live_YOUR_KEY
STRIPE_SECRET_KEY                          | sk_live_YOUR_KEY
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID      | price_xxxxx
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID       | price_xxxxx
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID | price_xxxxx
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID  | price_xxxxx
VITE_STRIPE_TEAM_MONTHLY_PRICE_ID         | price_xxxxx
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID          | price_xxxxx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. Click "Save" for each

6. Trigger redeploy:
   - Deployments tab → Click "..." → Redeploy
   - Or just push a commit (automatic redeploy)
```

---

### **Step 6: Set Up Webhook** (3 min)

**Why**: Stripe needs to notify your app about payment events.

```bash
1. Go to: https://dashboard.stripe.com/webhooks

2. Toggle to "Live mode" 🟢

3. Click "+ Add endpoint"

4. Endpoint URL:
   https://YOUR-APP.vercel.app/api/stripe-webhook
   
   (Replace YOUR-APP with your Vercel domain)

5. Events to listen for:
   ✓ checkout.session.completed
   ✓ customer.subscription.created
   ✓ customer.subscription.updated
   ✓ customer.subscription.deleted
   ✓ invoice.payment_succeeded
   ✓ invoice.payment_failed

6. Click "Add endpoint"

7. Reveal signing secret:
   - Click on the webhook you just created
   - Find "Signing secret"
   - Click "Reveal"
   - Copy: whsec_xxxxx

8. Add to Vercel env vars:
   Variable: STRIPE_WEBHOOK_SECRET
   Value: whsec_xxxxx
```

---

## 🧪 **Step 7: Test Live Mode** (5 min)

### **Test with Real Card** (Use Your Own):

```bash
1. Open your production site:
   https://YOUR-APP.vercel.app

2. Go to /pricing

3. Click "Start Free Trial" (Professional plan)

4. Stripe checkout opens

5. Enter REAL card details:
   - Your actual credit/debit card
   - Real expiration date
   - Real CVC
   - Real billing address

6. Complete payment

7. You should:
   ✓ Be charged $49 (or $0 if trial period set)
   ✓ Redirect to success page
   ✓ See subscription in Stripe dashboard
   ✓ Features unlock in app
```

**IMPORTANT**: You'll be charged for real! Cancel immediately if just testing.

### **Or Use Stripe Test Cards in Live Mode**:

Stripe allows test cards even in live mode (won't charge):

```
Test card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

This won't create real charge but tests the flow!
```

---

## ⚠️ **CRITICAL SECURITY**

### **Never Commit Live Keys to Git!**

```bash
# Make sure .env is in .gitignore:
cat .gitignore | grep .env

# Should show:
.env
.env.local
.env.production

# If not there, add it:
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

### **Live Keys Go In**:
- ✅ Vercel environment variables (production)
- ✅ .env file (local development - NEVER commit!)
- ❌ NEVER in .env.example (use placeholders only)
- ❌ NEVER in source code
- ❌ NEVER in git commits

---

## 📊 **Verify It's Working**

### **Check Stripe Dashboard**:

```bash
1. Go to: https://dashboard.stripe.com/payments

2. Toggle to "Live mode" 🟢

3. You should see:
   ✓ Test payment you just made
   ✓ Customer created
   ✓ Subscription active
   ✓ Amount charged (or $0 if trial)
```

### **Check Your App**:

```bash
1. Sign in to your app

2. Go to /app/settings

3. Look for subscription tier

4. Should show: "Professional" or "Team" ✅

5. Features should be unlocked:
   ✓ Unlimited datasets
   ✓ Voice control
   ✓ Deploy models
   ✓ All advanced features
```

---

## 🎯 **Quick Checklist**

**Before Going Live**:
- [ ] Stripe account activated
- [ ] Live API keys obtained
- [ ] Products created in live mode
- [ ] Price IDs copied
- [ ] .env updated with live keys
- [ ] Vercel env vars updated
- [ ] Webhook configured
- [ ] Test purchase completed
- [ ] Subscription shows in Stripe
- [ ] Features unlock in app

**When ALL checked**: ✅ **LIVE PAYMENTS ENABLED!**

---

## 💰 **Pricing Summary**

**Your Current Plans**:
```
Free Tier:
- 3 datasets
- Basic features
- Community support
- $0/month

Starter Plan:
- 25 datasets
- Advanced features
- Email support
- $25/month ($249/year)

Professional Plan:
- Unlimited datasets
- Voice control 🎙️
- AI copilot 🤖
- Scenario testing 🔮
- Model marketplace 🛍️
- Priority support
- $49/month ($489/year)

Team Plan:
- Everything in Pro
- Team collaboration
- Shared workspaces
- Admin controls
- $149/month ($1,489/year)
```

---

## 🚨 **Common Issues**

### **"Stripe account not activated"**
**Solution**: Complete activation form, wait for approval (up to 24 hours)

### **"Webhook not receiving events"**
**Solution**: 
- Check webhook URL is correct
- Verify endpoint exists (Supabase Edge Function)
- Check webhook signing secret in Vercel env

### **"Payment succeeds but subscription not created"**
**Solution**:
- Check webhook is configured
- Verify webhook secret is correct
- Check Supabase Edge Function logs

### **"Features don't unlock after payment"**
**Solution**:
- Check user_profile.tier updated in database
- Verify RLS policies allow user to see their subscription
- Check browser console for errors

---

## 🎯 **Quick Start (If You're in a Hurry)**

**Minimum to Accept Real Payments**:

```bash
1. Get live keys from Stripe dashboard
2. Update .env:
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   STRIPE_SECRET_KEY=sk_live_xxx
   
3. Run script to create products:
   npm run stripe:setup
   
4. Copy price IDs to .env

5. Update Vercel env vars (copy from .env)

6. Redeploy

7. Test with real card

DONE! ✅
```

**Total time**: 15 minutes if you rush

---

## 📞 **Need Help?**

**If something doesn't work**:

1. Check Stripe Dashboard → Logs (shows all API calls)
2. Check Vercel → Functions → Logs (shows webhook calls)
3. Check browser console (F12 → Console tab)
4. Check network tab (F12 → Network → Filter: stripe)

**Tell me the error and I'll help fix it!**

---

## ✅ **You're Ready for Real Money!**

**Once set up**:
- ✅ Accept real credit cards
- ✅ Get paid immediately (minus Stripe fees)
- ✅ Automatic subscription management
- ✅ Professional payment experience
- ✅ Customers trust it (Stripe is industry standard)

**Stripe fees**: 2.9% + 30¢ per transaction
- $25 plan = $0.73 + $0.30 = $1.03 fee → You get $23.97
- $49 plan = $1.42 + $0.30 = $1.72 fee → You get $47.28

---

**Want me to walk you through any specific step?** Just ask! 💪

**Your Marketing Director** 🤖  
**Mission**: Get you accepting real payments  
**Status**: Step-by-step guide ready ✅  
**Next**: Follow the steps above! 💳
