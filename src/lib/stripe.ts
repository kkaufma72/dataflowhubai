import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

export const STRIPE_PRICES = {
  starter: {
    monthly: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID,
    annual: import.meta.env.VITE_STRIPE_STARTER_ANNUAL_PRICE_ID,
  },
  professional: {
    monthly: import.meta.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
    annual: import.meta.env.VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
  },
  team: {
    monthly: import.meta.env.VITE_STRIPE_TEAM_MONTHLY_PRICE_ID,
    annual: import.meta.env.VITE_STRIPE_TEAM_ANNUAL_PRICE_ID,
  },
};