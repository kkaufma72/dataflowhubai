#!/bin/bash

###############################################################################
# Stripe Product Setup Script (using Stripe CLI)
#
# This script creates all required products and prices using the Stripe CLI.
# You must have the Stripe CLI installed and logged in.
#
# Usage:
#   chmod +x scripts/setup-stripe-products.sh
#   ./scripts/setup-stripe-products.sh
#
# Prerequisites:
#   - Stripe CLI installed (npm install -g stripe or brew install stripe)
#   - Logged in: stripe login
###############################################################################

set -e  # Exit on error

echo "🎯 Starting Stripe product setup with Stripe CLI..."
echo ""

# Check if Stripe CLI is available
if ! command -v stripe &> /dev/null; then
    echo "❌ Error: Stripe CLI not found"
    echo ""
    echo "Install it with:"
    echo "  npm install -g stripe"
    echo "  OR"
    echo "  brew install stripe/stripe-cli/stripe"
    echo ""
    echo "Then run: stripe login"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creating Starter Plan..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create Starter Plan Product
STARTER_PRODUCT=$(stripe products create \
  --name="Starter Plan" \
  --description="Perfect for individuals getting started with AI" \
  --format=json)

STARTER_PRODUCT_ID=$(echo $STARTER_PRODUCT | grep -o '"id": "[^"]*' | grep -o '[^"]*$' | head -1)
echo "✓ Product created: $STARTER_PRODUCT_ID"

# Create Starter Monthly Price
STARTER_MONTHLY=$(stripe prices create \
  --product=$STARTER_PRODUCT_ID \
  --unit-amount=2900 \
  --currency=usd \
  --recurring=interval=month \
  --nickname="Starter Monthly" \
  --format=json)

STARTER_MONTHLY_PRICE_ID=$(echo $STARTER_MONTHLY | grep -o '"id": "[^"]*' | grep -o '[^"]*$' | head -1)
echo "✓ Monthly price created: $STARTER_MONTHLY_PRICE_ID ($29/month)"

# Create Starter Annual Price
STARTER_ANNUAL=$(stripe prices create \
  --product=$STARTER_PRODUCT_ID \
  --unit-amount=29000 \
  --currency=usd \
  --recurring=interval=year \
  --nickname="Starter Annual" \
  --format=json)

STARTER_ANNUAL_PRICE_ID=$(echo $STARTER_ANNUAL | grep -o '"id": "[^"]*' | grep -o '[^"]*$' | head -1)
echo "✓ Annual price created: $STARTER_ANNUAL_PRICE_ID ($290/year)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creating Professional Plan..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create Professional Plan Product
PROFESSIONAL_PRODUCT=$(stripe products create \
  --name="Professional Plan" \
  --description="Advanced features for power users" \
  --format=json)

PROFESSIONAL_PRODUCT_ID=$(echo $PROFESSIONAL_PRODUCT | grep -o '"id": "[^"]*' | grep -o '[^"]*$' | head -1)
echo "✓ Product created: $PROFESSIONAL_PRODUCT_ID"

# Create Professional Monthly Price
PROFESSIONAL_MONTHLY=$(stripe prices create \
  --product=$PROFESSIONAL_PRODUCT_ID \
  --unit-amount=9900 \
  --currency=usd \
  --recurring=interval=month \
  --nickname="Professional Monthly" \
  --format=json)

PROFESSIONAL_MONTHLY_PRICE_ID=$(echo $PROFESSIONAL_MONTHLY | grep -o '"id": "[^"]*' | grep -o '[^"]*$' | head -1)
echo "✓ Monthly price created: $PROFESSIONAL_MONTHLY_PRICE_ID ($99/month)"

# Create Professional Annual Price
PROFESSIONAL_ANNUAL=$(stripe prices create \
  --product=$PROFESSIONAL_PRODUCT_ID \
  --unit-amount=99000 \
  --currency=usd \
  --recurring=interval=year \
  --nickname="Professional Annual" \
  --format=json)

PROFESSIONAL_ANNUAL_PRICE_ID=$(echo $PROFESSIONAL_ANNUAL | grep -o '"id": "[^"]*' | grep -o '[^"]*$' | head -1)
echo "✓ Annual price created: $PROFESSIONAL_ANNUAL_PRICE_ID ($990/year)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creating Team Plan..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create Team Plan Product
TEAM_PRODUCT=$(stripe products create \
  --name="Team Plan" \
  --description="Collaboration tools for teams" \
  --format=json)

TEAM_PRODUCT_ID=$(echo $TEAM_PRODUCT | grep -o '"id": "[^"]*' | grep -o '[^"]*$' | head -1)
echo "✓ Product created: $TEAM_PRODUCT_ID"

# Create Team Monthly Price
TEAM_MONTHLY=$(stripe prices create \
  --product=$TEAM_PRODUCT_ID \
  --unit-amount=29900 \
  --currency=usd \
  --recurring=interval=month \
  --nickname="Team Monthly" \
  --format=json)

TEAM_MONTHLY_PRICE_ID=$(echo $TEAM_MONTHLY | grep -o '"id": "[^"]*' | grep -o '[^"]*$' | head -1)
echo "✓ Monthly price created: $TEAM_MONTHLY_PRICE_ID ($299/month)"

# Create Team Annual Price
TEAM_ANNUAL=$(stripe prices create \
  --product=$TEAM_PRODUCT_ID \
  --unit-amount=299000 \
  --currency=usd \
  --recurring=interval=year \
  --nickname="Team Annual" \
  --format=json)

TEAM_ANNUAL_PRICE_ID=$(echo $TEAM_ANNUAL | grep -o '"id": "[^"]*' | grep -o '[^"]*$' | head -1)
echo "✓ Annual price created: $TEAM_ANNUAL_PRICE_ID ($2990/year)"
echo ""

echo "✅ All products and prices created successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Add these to your .env file:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=$STARTER_MONTHLY_PRICE_ID"
echo "VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=$STARTER_ANNUAL_PRICE_ID"
echo "VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=$PROFESSIONAL_MONTHLY_PRICE_ID"
echo "VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=$PROFESSIONAL_ANNUAL_PRICE_ID"
echo "VITE_STRIPE_TEAM_MONTHLY_PRICE_ID=$TEAM_MONTHLY_PRICE_ID"
echo "VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=$TEAM_ANNUAL_PRICE_ID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Quick update .env:"
echo ""
echo "cat >> .env << 'EOF'"
echo "VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=$STARTER_MONTHLY_PRICE_ID"
echo "VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=$STARTER_ANNUAL_PRICE_ID"
echo "VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=$PROFESSIONAL_MONTHLY_PRICE_ID"
echo "VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=$PROFESSIONAL_ANNUAL_PRICE_ID"
echo "VITE_STRIPE_TEAM_MONTHLY_PRICE_ID=$TEAM_MONTHLY_PRICE_ID"
echo "VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=$TEAM_ANNUAL_PRICE_ID"
echo "EOF"
echo ""
echo "🎉 Setup complete!"
