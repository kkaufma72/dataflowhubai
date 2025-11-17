const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_KEY_HERE');

async function createProducts() {
  const products = [
    {
      name: 'DataFlowHub Starter (Monthly)',
      price: 2500, // $25.00
      interval: 'month',
      tier: 'starter',
      billing: 'monthly',
      trial_days: 14
    },
    {
      name: 'DataFlowHub Starter (Annual)',
      price: 25000, // $250.00 (save $50/year)
      interval: 'year',
      tier: 'starter',
      billing: 'annual',
      trial_days: 14
    },
    {
      name: 'DataFlowHub Professional (Monthly)',
      price: 5000, // $50.00
      interval: 'month',
      tier: 'professional',
      billing: 'monthly',
      trial_days: 14
    },
    {
      name: 'DataFlowHub Professional (Annual)',
      price: 50000, // $500.00 (save $100/year)
      interval: 'year',
      tier: 'professional',
      billing: 'annual',
      trial_days: 14
    },
  ];

  const priceIds = {};

  console.log('🚀 Creating Stripe products and prices...\n');

  for (const product of products) {
    try {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: `DataFlowHub ${product.tier} plan - ${product.billing} billing`,
      });

      const price = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.price,
        currency: 'usd',
        recurring: {
          interval: product.interval,
        },
      });

      const envVarName = `VITE_STRIPE_${product.tier.toUpperCase()}_${product.billing.toUpperCase()}_PRICE_ID`;
      priceIds[envVarName] = price.id;

      console.log(`✅ Created ${product.name}`);
      console.log(`   Product ID: ${stripeProduct.id}`);
      console.log(`   Price ID: ${price.id}`);
      console.log(`   Trial: ${product.trial_days} days`);
      console.log('');
    } catch (error) {
      console.error(`❌ Error creating ${product.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 Add these to your .env file:');
  console.log('='.repeat(80) + '\n');
  
  for (const [key, value] of Object.entries(priceIds)) {
    console.log(`${key}=${value}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 Copy these commands to set your Supabase secrets:');
  console.log('='.repeat(80) + '\n');
  
  for (const [key, value] of Object.entries(priceIds)) {
    console.log(`npx supabase secrets set ${key}=${value}`);
  }
  
  console.log('\n' + '='.repeat(80));
}

createProducts().catch(console.error);
