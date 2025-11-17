/**
 * Stripe Configuration Checker
 * Validates that all required Stripe environment variables are properly configured
 */

interface StripeConfigStatus {
  isConfigured: boolean;
  missingVars: string[];
  warnings: string[];
  publishableKey?: string;
  isTestMode: boolean;
  priceIds: {
    starter: { monthly?: string; annual?: string };
    professional: { monthly?: string; annual?: string };
  };
}

export function checkStripeConfig(): StripeConfigStatus {
  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check publishable key
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    missingVars.push('VITE_STRIPE_PUBLISHABLE_KEY');
  }

  const isTestMode = publishableKey?.includes('test') ?? false;

  // Check all price IDs (Enterprise doesn't need price IDs - it's "Talk to Sales")
  const priceIds = {
    starter: {
      monthly: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID,
      annual: import.meta.env.VITE_STRIPE_STARTER_ANNUAL_PRICE_ID,
    },
    professional: {
      monthly: import.meta.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
      annual: import.meta.env.VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
    },
  };

  // Check for missing price IDs
  if (!priceIds.starter.monthly) missingVars.push('VITE_STRIPE_STARTER_MONTHLY_PRICE_ID');
  if (!priceIds.starter.annual) missingVars.push('VITE_STRIPE_STARTER_ANNUAL_PRICE_ID');
  if (!priceIds.professional.monthly) missingVars.push('VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID');
  if (!priceIds.professional.annual) missingVars.push('VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID');

  // Generate warnings
  if (missingVars.length > 0) {
    warnings.push(
      `Missing ${missingVars.length} Stripe environment variable${missingVars.length > 1 ? 's' : ''}`
    );
    warnings.push('Payment features will not work until configured');
  }

  if (isTestMode && import.meta.env.PROD) {
    warnings.push('⚠️ Using Stripe TEST keys in production environment!');
  }

  const isConfigured = missingVars.length === 0;

  return {
    isConfigured,
    missingVars,
    warnings,
    publishableKey,
    isTestMode,
    priceIds,
  };
}

/**
 * Log Stripe configuration status to console
 */
export function logStripeConfig(): void {
  const status = checkStripeConfig();

  console.group('🔧 Stripe Configuration Status');

  if (status.isConfigured) {
    console.log('✅ All Stripe environment variables configured');
    console.log(`📍 Mode: ${status.isTestMode ? 'TEST' : 'LIVE'}`);
    console.log('💳 Publishable Key:', status.publishableKey?.substring(0, 20) + '...');
  } else {
    console.warn('❌ Stripe configuration incomplete');
    console.warn(`Missing ${status.missingVars.length} variables:`, status.missingVars);
  }

  if (status.warnings.length > 0) {
    console.warn('⚠️ Warnings:');
    status.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  console.log('\n📋 Price IDs:');
  console.table({
    'Starter (Monthly)': status.priceIds.starter.monthly || '❌ Missing',
    'Starter (Annual)': status.priceIds.starter.annual || '❌ Missing',
    'Professional (Monthly)': status.priceIds.professional.monthly || '❌ Missing',
    'Professional (Annual)': status.priceIds.professional.annual || '❌ Missing',
  });
  console.log('ℹ️ Enterprise plan uses "Talk to Sales" (no price IDs needed)');

  if (!status.isConfigured) {
    console.log('\n📖 Setup Instructions:');
    console.log('1. Add to Vercel: https://vercel.com/dashboard → Settings → Environment Variables');
    console.log('2. Add to Supabase: npx supabase secrets set STRIPE_SECRET_KEY=sk_...');
    console.log('3. Run: node create-stripe-products.cjs (to generate price IDs)');
  }

  console.groupEnd();
}

/**
 * Get user-friendly error message for missing Stripe config
 */
export function getStripeConfigError(): string | null {
  const status = checkStripeConfig();
  
  if (status.isConfigured) {
    return null;
  }

  return `Stripe is not fully configured. Missing: ${status.missingVars.join(', ')}. Please contact support.`;
}

/**
 * Check if Stripe is ready to process payments
 */
export function isStripeReady(): boolean {
  return checkStripeConfig().isConfigured;
}
