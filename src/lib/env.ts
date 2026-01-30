/**
 * Environment Configuration & Validation
 * 
 * Production-grade environment variable management with:
 * - Runtime validation
 * - Type safety
 * - Default values for development
 * - Clear error messages for missing required vars
 */

// Required environment variables (app won't work without these)
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

// Optional environment variables (app works but with limited features)
const OPTIONAL_ENV_VARS = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_OPENAI_API_KEY',
  'VITE_FRED_API_KEY',
  'VITE_SENTRY_DSN',
  'VITE_POSTHOG_API_KEY',
  'VITE_POSTHOG_HOST',
] as const;

type RequiredEnvVar = typeof REQUIRED_ENV_VARS[number];
type OptionalEnvVar = typeof OPTIONAL_ENV_VARS[number];

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validates that all required environment variables are present
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const key of REQUIRED_ENV_VARS) {
    const value = import.meta.env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  // Check optional vars and warn if missing
  for (const key of OPTIONAL_ENV_VARS) {
    const value = import.meta.env[key];
    if (!value || value.trim() === '') {
      warnings.push(`Optional: ${key} is not set. Some features may be limited.`);
    }
  }

  // Log issues in development
  if (import.meta.env.DEV) {
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing);
    }
    if (warnings.length > 0) {
      console.warn('⚠️ Missing optional environment variables:', warnings);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get environment variable with type safety
 */
function getEnvVar(key: RequiredEnvVar | OptionalEnvVar, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (value && value.trim() !== '') {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  // Return empty string for optional vars, throw for required
  if (REQUIRED_ENV_VARS.includes(key as RequiredEnvVar)) {
    console.error(`Missing required environment variable: ${key}`);
  }
  return '';
}

/**
 * Check if a feature is enabled based on environment configuration
 */
function isFeatureEnabled(key: OptionalEnvVar): boolean {
  const value = import.meta.env[key];
  return !!(value && value.trim() !== '');
}

/**
 * Environment configuration object
 * Type-safe access to all environment variables
 */
export const env = {
  // App mode
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
  mode: import.meta.env.MODE,

  // Supabase (required)
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  },

  // Stripe (optional)
  stripe: {
    publishableKey: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY', ''),
    isEnabled: isFeatureEnabled('VITE_STRIPE_PUBLISHABLE_KEY'),
  },

  // OpenAI (optional)
  openai: {
    apiKey: getEnvVar('VITE_OPENAI_API_KEY', ''),
    isEnabled: isFeatureEnabled('VITE_OPENAI_API_KEY'),
  },

  // FRED API (optional)
  fred: {
    apiKey: getEnvVar('VITE_FRED_API_KEY', ''),
    isEnabled: isFeatureEnabled('VITE_FRED_API_KEY'),
  },

  // Monitoring & Analytics (optional)
  sentry: {
    dsn: getEnvVar('VITE_SENTRY_DSN', ''),
    isEnabled: isFeatureEnabled('VITE_SENTRY_DSN'),
  },

  posthog: {
    apiKey: getEnvVar('VITE_POSTHOG_API_KEY', ''),
    host: getEnvVar('VITE_POSTHOG_HOST', 'https://app.posthog.com'),
    isEnabled: isFeatureEnabled('VITE_POSTHOG_API_KEY'),
  },

  // Feature flags
  features: {
    hasStripe: isFeatureEnabled('VITE_STRIPE_PUBLISHABLE_KEY'),
    hasAI: isFeatureEnabled('VITE_OPENAI_API_KEY'),
    hasFRED: isFeatureEnabled('VITE_FRED_API_KEY'),
    hasErrorTracking: isFeatureEnabled('VITE_SENTRY_DSN'),
    hasAnalytics: isFeatureEnabled('VITE_POSTHOG_API_KEY'),
  },
} as const;

/**
 * Initialize environment on app start
 * Returns true if app can proceed, false if critical config is missing
 */
export function initializeEnv(): boolean {
  const result = validateEnv();
  
  if (!result.valid) {
    if (import.meta.env.PROD) {
      // In production, log to error tracking if available
      console.error('Application cannot start: missing required configuration');
    }
    return false;
  }

  if (import.meta.env.DEV) {
    console.log('✅ Environment validated successfully');
    console.log('📊 Features enabled:', {
      stripe: env.features.hasStripe,
      ai: env.features.hasAI,
      fred: env.features.hasFRED,
      errorTracking: env.features.hasErrorTracking,
      analytics: env.features.hasAnalytics,
    });
  }

  return true;
}

export default env;
