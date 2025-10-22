# Stripe Setup Scripts

Automatically create all Stripe products and prices without manual dashboard work!

## Quick Start (Easiest Method)

### Option 1: Using npm script (Recommended)

```bash
# 1. Install dependencies (if you haven't already)
npm install

# 2. Make sure STRIPE_SECRET_KEY is in your .env file
# It should already be there: sk_test_51SKT0E2MMddtMstz...

# 3. Run the setup script
npm run stripe:setup
```

This will:
- ✅ Create 3 products (Starter, Professional, Team)
- ✅ Create 6 prices (monthly and annual for each)
- ✅ Output the Price IDs to copy into your .env file

### Option 2: Using Stripe CLI

If you prefer using the Stripe CLI:

```bash
# 1. Make the script executable
chmod +x scripts/setup-stripe-products.sh

# 2. Run the script
./scripts/setup-stripe-products.sh
```

**Prerequisites:**
- Stripe CLI installed (`npm install -g stripe` or `brew install stripe/stripe-cli/stripe`)
- Logged in: `stripe login`

## What Gets Created

### Products & Prices

| Product | Monthly | Annual |
|---------|---------|--------|
| Starter Plan | $29/mo | $290/yr (save $58) |
| Professional Plan | $99/mo | $990/yr (save $198) |
| Team Plan | $299/mo | $2990/yr (save $598) |

### Environment Variables

After running the script, you'll get 6 Price IDs to add to your `.env`:

```env
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxxx
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_xxxxx
VITE_STRIPE_TEAM_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=price_xxxxx
```

## Updating Your .env File

The script will output the exact values you need. You can either:

### Method 1: Copy/Paste
Copy the output and paste it into your `.env` file manually.

### Method 2: Auto-append (careful!)
The script will also show you a command to automatically append to your `.env`:

```bash
cat >> .env << 'EOF'
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxxx
# ... etc
EOF
```

## Troubleshooting

### "STRIPE_SECRET_KEY not found"
Make sure your `.env` file contains:
```env
STRIPE_SECRET_KEY=sk_test_51SKT0E2MMddtMstzIhY1lipJ0v8RQiBgBIxmrRgGzU3OvwwiYru8zflz2lAT4VlycVFgKUrMTUHh2Lh62qrBB2Pp00Odrs5Q5E
```

### "Stripe API error"
- Verify you're using a **test** key (starts with `sk_test_`)
- Check you have internet connection
- Make sure the key is valid (not revoked)

### "Command not found: stripe" (for CLI method)
Install Stripe CLI:
```bash
npm install -g stripe
# OR
brew install stripe/stripe-cli/stripe

# Then login
stripe login
```

### "dotenv not found" (for npm script method)
Install dependencies:
```bash
npm install
```

## Verifying Setup

After running the script:

1. **Check Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/products
   - You should see 3 products with 2 prices each

2. **Update .env:**
   - Replace the placeholder price IDs with the real ones from script output

3. **Test locally:**
   ```bash
   npm run dev
   # Visit http://localhost:5173/pricing
   ```

## Next Steps

After creating products:

1. ✅ Products created (you just did this!)
2. ⏭️ Set up webhook in Stripe Dashboard
3. ⏭️ Update `.env` with Price IDs
4. ⏭️ Test checkout flow

See `STRIPE_SETUP_GUIDE.md` in the project root for complete setup instructions.

## Manual Creation (Alternative)

If these scripts don't work for you, follow the manual instructions in `STRIPE_SETUP_GUIDE.md`.
