#!/usr/bin/env node

/**
 * Stripe Product Setup Script
 *
 * This script automatically creates all required products and prices in Stripe.
 * Run this once to set up your Stripe account.
 *
 * Usage:
 *   node scripts/setup-stripe-products.js
 *
 * Make sure STRIPE_SECRET_KEY is set in your .env file first!
 */

import https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY not found in .env file');
  console.error('Please add your Stripe secret key to .env first');
  process.exit(1);
}

console.log('🎯 Starting Stripe product setup...\n');

// Product configurations
const PRODUCTS = [
  {
    name: 'Starter Plan',
    description: 'Perfect for individuals getting started with AI',
    prices: [
      { amount: 2900, interval: 'month', nickname: 'Starter Monthly' },
      { amount: 29000, interval: 'year', nickname: 'Starter Annual' }
    ]
  },
  {
    name: 'Professional Plan',
    description: 'Advanced features for power users',
    prices: [
      { amount: 9900, interval: 'month', nickname: 'Professional Monthly' },
      { amount: 99000, interval: 'year', nickname: 'Professional Annual' }
    ]
  },
  {
    name: 'Team Plan',
    description: 'Collaboration tools for teams',
    prices: [
      { amount: 29900, interval: 'month', nickname: 'Team Monthly' },
      { amount: 299000, interval: 'year', nickname: 'Team Annual' }
    ]
  }
];

// Stripe API helper
function stripeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.stripe.com',
      path: `/v1/${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(response.error?.message || 'Stripe API error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      const params = new URLSearchParams(data);
      req.write(params.toString());
    }

    req.end();
  });
}

// Create a product
async function createProduct(productData) {
  console.log(`📦 Creating product: ${productData.name}...`);

  const product = await stripeRequest('POST', 'products', {
    name: productData.name,
    description: productData.description
  });

  console.log(`   ✓ Product created: ${product.id}`);
  return product;
}

// Create a price for a product
async function createPrice(productId, priceData) {
  const displayAmount = (priceData.amount / 100).toFixed(2);
  console.log(`   💰 Creating ${priceData.interval}ly price: $${displayAmount}...`);

  const price = await stripeRequest('POST', 'prices', {
    product: productId,
    unit_amount: priceData.amount,
    currency: 'usd',
    'recurring[interval]': priceData.interval,
    nickname: priceData.nickname
  });

  console.log(`      ✓ Price created: ${price.id}`);
  return price;
}

// Main setup function
async function setupStripeProducts() {
  const results = {
    VITE_STRIPE_STARTER_MONTHLY_PRICE_ID: '',
    VITE_STRIPE_STARTER_ANNUAL_PRICE_ID: '',
    VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID: '',
    VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID: '',
    VITE_STRIPE_TEAM_MONTHLY_PRICE_ID: '',
    VITE_STRIPE_TEAM_ANNUAL_PRICE_ID: ''
  };

  const envVarKeys = [
    ['VITE_STRIPE_STARTER_MONTHLY_PRICE_ID', 'VITE_STRIPE_STARTER_ANNUAL_PRICE_ID'],
    ['VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID', 'VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID'],
    ['VITE_STRIPE_TEAM_MONTHLY_PRICE_ID', 'VITE_STRIPE_TEAM_ANNUAL_PRICE_ID']
  ];

  try {
    for (let i = 0; i < PRODUCTS.length; i++) {
      const productConfig = PRODUCTS[i];
      const product = await createProduct(productConfig);

      for (let j = 0; j < productConfig.prices.length; j++) {
        const priceConfig = productConfig.prices[j];
        const price = await createPrice(product.id, priceConfig);

        // Map to env var
        const envVarKey = envVarKeys[i][j];
        results[envVarKey] = price.id;
      }

      console.log(''); // Empty line for readability
    }

    console.log('✅ All products and prices created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Add these to your .env file:\n');

    Object.entries(results).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Quick command to update .env:\n');
    console.log('cat >> .env << \'EOF\'');
    Object.entries(results).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });
    console.log('EOF');
    console.log('');

    console.log('🎉 Setup complete! Next steps:');
    console.log('   1. Update your .env file with the price IDs above');
    console.log('   2. Set up webhook in Stripe Dashboard');
    console.log('   3. Test your checkout flow');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Make sure your STRIPE_SECRET_KEY is correct');
    console.error('- Check that you\'re using a test mode key (starts with sk_test_)');
    console.error('- Verify you have internet connection');
    process.exit(1);
  }
}

// Run setup
setupStripeProducts();
