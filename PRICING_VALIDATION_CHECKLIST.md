# Pricing & Checkout Validation Checklist

## 🔍 Quick Validation Steps

### 1. Visual Consistency Check (2 minutes)

**Landing Page** (`http://localhost:5173/`)
- [ ] Professional shows **$49/month**
- [ ] Free shows **$0/month**
- [ ] Team shows **$149/month**

**Pricing Page** (`http://localhost:5173/pricing`)
- [ ] Professional shows **$49/month**
- [ ] Starter shows **$25/month**
- [ ] Free shows **$0/month**
- [ ] Enterprise shows "Custom"
- [ ] Monthly/Annual toggle works
- [ ] Annual shows savings (17-20%)

### 2. Browser Console Check (1 minute)

Open browser DevTools (F12) and check:

```javascript
// Check environment variables are loaded
console.log({
  starterMonthly: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID,
  starterAnnual: import.meta.env.VITE_STRIPE_STARTER_ANNUAL_PRICE_ID,
  proMonthly: import.meta.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
  proAnnual: import.meta.env.VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
  teamMonthly: import.meta.env.VITE_STRIPE_TEAM_MONTHLY_PRICE_ID,
  teamAnnual: import.meta.env.VITE_STRIPE_TEAM_ANNUAL_PRICE_ID
});
```

**Expected Output:**
```
{
  starterMonthly: "price_1SULEz4FgetVK6Ve14ZzMY9x",
  starterAnnual: "price_1SULF04FgetVK6VesWm6SBRk",
  proMonthly: "price_1SVhdd4FgetVK6VexKdwUq4G",
  proAnnual: "price_1SVhdd4FgetVK6VervAoFElm",
  teamMonthly: "price_1SVhdd4FgetVK6Ve5gKqJCPx",
  teamAnnual: "price_1SVhdd4FgetVK6Ve71yiaSFy"
}
```

### 3. Checkout Flow Test - Logged Out User (5 minutes)

**Test Professional Plan:**

1. Go to pricing page: `http://localhost:5173/pricing`
2. Click "Start Free Trial" on **Professional** plan
3. Should see email modal popup
4. Enter test email: `test@example.com`
5. Click "Continue to Payment"
6. Check browser console for logs:
   ```
   🚀 ========== STRIPE CHECKOUT START ==========
   📦 Input params: {tier: 'professional', billing: 'monthly', email: 'test@example.com'}
   📞 Calling Supabase Edge Function: create-checkout-session
   ✅ Checkout URL received: https://checkout.stripe.com/...
   ```
7. Should redirect to Stripe Checkout page
8. **Verify on Stripe page:**
   - [ ] Shows "Professional Plan"
   - [ ] Amount is **$49.00/month**
   - [ ] Payment form is visible

**Test with Card:** (Use Stripe test card)
```
Card: 4242 4242 4242 4242
Exp: Any future date (e.g., 12/26)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

9. Complete payment
10. Should redirect to `/signup-complete?success=true`
11. Check email for password setup link

### 4. Checkout Flow Test - Logged In User (3 minutes)

1. Sign in first: `http://localhost:5173/signin`
2. Go to pricing: `http://localhost:5173/pricing`
3. Click "Start Free Trial" on any paid plan
4. Should skip email modal and go directly to Stripe
5. Should redirect to `/app?success=true` after payment

### 5. LinkedIn Tracking Validation (2 minutes)

**Check Insight Tag Loads:**

1. Open any page on your site
2. Open DevTools → Network tab
3. Filter by "linkedin" or "snap.licdn.com"
4. Should see requests to:
   - `https://snap.licdn.com/li.lms-analytics/insight.min.js`
   - `https://px.ads.linkedin.com/collect/?pid=8260938`

**Check in Console:**
```javascript
// Should return function
console.log(typeof window.lintrk);  // "function"
console.log(window._linkedin_data_partner_ids);  // ["8260938"]
```

### 6. Stripe Dashboard Verification (2 minutes)

**Go to:** https://dashboard.stripe.com/test/payments

After test checkout, verify:
- [ ] Payment appears in dashboard
- [ ] Customer created with email
- [ ] Subscription is "Active"
- [ ] Correct price ID linked
- [ ] Correct amount ($49 for Professional)

### 7. Supabase Edge Function Logs (Advanced)

**Check Edge Function is working:**

```bash
# In terminal
cd /Users/kyle/Desktop/design/dataflowhubai
supabase functions logs create-checkout-session
```

Should see logs when checkout is triggered.

---

## 🐛 Common Issues & Fixes

### Issue: Email modal doesn't appear
**Fix:** You're logged in. Log out first or use incognito mode.

### Issue: "Payment processing is temporarily unavailable"
**Check:**
```bash
# Verify Stripe keys are set
grep VITE_STRIPE .env
```
Should show publishable key starting with `pk_test_`

### Issue: Checkout redirects but no page loads
**Check:** 
1. Success URL is correct in Edge Function
2. Routes exist: `/signup-complete` and `/app`

### Issue: LinkedIn Insight Tag not loading
**Check:**
```bash
# Verify index.html has the tag
grep -A 5 "LinkedIn Insight Tag" index.html
```

### Issue: Wrong price showing in Stripe
**Fix:** 
1. Clear browser cache
2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. Check .env has latest price IDs

### Issue: Edge Function timeout
**Check Network tab:** If taking >30s, check:
1. Supabase project is running
2. Edge Function is deployed
3. No CORS errors in console

---

## 🎯 Quick Test Command

Run this in your browser console on the pricing page:

```javascript
// Test all pricing displays correctly
const prices = {
  free: document.querySelector('[data-tier="free"]')?.textContent,
  starter: document.querySelector('[data-tier="starter"]')?.textContent,
  professional: document.querySelector('[data-tier="professional"]')?.textContent,
  enterprise: document.querySelector('[data-tier="enterprise"]')?.textContent
};

console.log('Displayed Prices:', prices);

// Check if prices match expected values
const expected = {
  professional: '$49',
  starter: '$25',
  free: '$0'
};

const validation = Object.keys(expected).map(tier => ({
  tier,
  expected: expected[tier],
  actual: prices[tier],
  match: prices[tier]?.includes(expected[tier])
}));

console.table(validation);
```

---

## ✅ Success Criteria

**All tests pass when:**

1. ✅ All pages show $49 for Professional
2. ✅ Checkout opens Stripe page with correct price
3. ✅ Test payment completes successfully
4. ✅ User receives confirmation email
5. ✅ LinkedIn tracking fires on all pages
6. ✅ No console errors during checkout
7. ✅ Subscription appears in Stripe dashboard

---

## 🚀 Ready for Production?

Before switching to live mode:

- [ ] All test checkouts work perfectly
- [ ] LinkedIn Insight Tag validated
- [ ] Pricing consistent across all pages
- [ ] Error handling tested (cancelled payments, failed cards)
- [ ] Email notifications working
- [ ] Webhook endpoint configured in Stripe
- [ ] Switch to live Stripe keys in production
- [ ] Test one real transaction with live keys

---

**Last Updated:** November 20, 2025
**Current Prices:** Free ($0), Starter ($25), Professional ($49), Team ($149)
**Stripe Mode:** Test (pk_test_...)
