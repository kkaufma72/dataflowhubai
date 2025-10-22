# Production Deployment Guide

This guide walks you through deploying DataFlowHub AI to production with Supabase authentication and Stripe subscriptions.

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account
- Netlify/Vercel account (for frontend)

## 1. Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Project Settings > API

### Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

Or manually run the SQL migrations in order from `supabase/migrations/` in the SQL Editor.

### Configure Authentication

1. Go to Authentication > Providers in Supabase Dashboard
2. Enable Email provider and configure:
   - Enable email confirmations (recommended)
   - Set custom SMTP settings (optional but recommended for production)
   
3. Enable OAuth providers (optional):
   - Google OAuth
   - GitHub OAuth
   - Configure redirect URLs to your domain

### Deploy Edge Functions

```bash
# Deploy all edge functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-billing-portal

# Set environment variables for edge functions
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_webhook_secret
supabase secrets set VITE_APP_URL=https://your-domain.com
```

## 2. Stripe Setup

### Create Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Products > Add Product
3. Create the following products:

**Starter Plan:**
- Name: DataFlowHub AI - Starter
- Monthly Price: $29/month
- Annual Price: $290/year
- Note the price IDs

**Professional Plan:**
- Name: DataFlowHub AI - Professional  
- Monthly Price: $99/month
- Annual Price: $990/year
- Note the price IDs

**Team Plan:**
- Name: DataFlowHub AI - Team
- Monthly Price: $299/month
- Annual Price: $2990/year
- Note the price IDs

### Configure Webhook

1. Go to Developers > Webhooks > Add endpoint
2. Set endpoint URL to: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Note the webhook signing secret

### Enable Customer Portal

1. Go to Settings > Billing > Customer portal
2. Enable customer portal
3. Configure branding and features
4. Add your business information

## 3. Environment Variables

### Create .env file

Copy `.env.example` to `.env` and fill in the values:

```bash
# OpenAI (for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key
OPENAI_API_KEY=your_openai_api_key

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_...
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_PRO_ANNUAL_PRICE_ID=price_...
VITE_STRIPE_TEAM_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=price_...

# Application URL
VITE_APP_URL=https://your-domain.com
```

## 4. Frontend Deployment

### Netlify Deployment

1. Push code to GitHub
2. Go to [Netlify](https://netlify.com) and create new site from Git
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Site Settings > Environment Variables
5. Deploy!

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# ... add all other variables

# Deploy to production
vercel --prod
```

## 5. Post-Deployment Checklist

### Security

- [ ] Enable RLS policies on all tables
- [ ] Verify API keys are not exposed in client code
- [ ] Set up CORS properly for API endpoints
- [ ] Enable 2FA on admin accounts
- [ ] Review and test authentication flows

### Performance

- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images and assets
- [ ] Test page load times
- [ ] Set up database indexes

### Monitoring

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring
- [ ] Enable Supabase logging
- [ ] Set up Stripe webhook monitoring

### Testing

- [ ] Test signup/login flows
- [ ] Test OAuth providers
- [ ] Test password reset
- [ ] Test subscription upgrade flow
- [ ] Test payment processing
- [ ] Test webhook handling
- [ ] Test cancellation flow
- [ ] Load testing

### Legal

- [ ] Add Terms of Service
- [ ] Add Privacy Policy
- [ ] Add Cookie Policy
- [ ] Configure GDPR compliance
- [ ] Set up data retention policies

## 6. Ongoing Maintenance

### Regular Tasks

- Monitor error logs daily
- Review Stripe dashboard for failed payments
- Check Supabase metrics for performance
- Update dependencies monthly
- Backup database regularly
- Review and optimize costs

### User Support

- Set up support email
- Create help documentation
- Set up in-app chat (optional)
- Monitor user feedback
- Track feature requests

## 7. Scaling Considerations

As your application grows:

- Consider upgrading Supabase plan
- Implement database connection pooling
- Add Redis for caching
- Consider CDN for global distribution
- Implement queue system for background jobs
- Set up auto-scaling for Edge Functions

## 8. Troubleshooting

### Common Issues

**Stripe webhook not receiving events:**
- Verify webhook URL is correct
- Check webhook signing secret
- Review Stripe webhook logs
- Ensure Edge Function is deployed

**Authentication issues:**
- Check redirect URLs in Supabase
- Verify OAuth app credentials
- Check email service configuration
- Review RLS policies

**Subscription not updating:**
- Check Stripe webhook logs
- Verify metadata is being passed
- Check Edge Function logs
- Ensure database permissions are correct

## Support

For issues or questions:
- Check documentation: [dataflowhubai.com/docs](https://dataflowhubai.com/docs)
- Email: support@dataflowhubai.com
- GitHub Issues: [github.com/your-org/dataflowhubai](https://github.com/your-org/dataflowhubai)
