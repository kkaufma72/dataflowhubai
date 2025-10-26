# Supabase Email Configuration

## Problem
Users are not receiving verification emails after signup.

## Solution: Disable Email Confirmation (Development)

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll down to **"Email Confirmation"** section
5. **Disable** "Enable email confirmations"
6. Click **Save**

### Option 2: Via SQL (Alternative)

Run this SQL in the Supabase SQL Editor:

```sql
-- Disable email confirmation for development
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

### Option 3: Manual Confirmation

For existing users, you can manually confirm them:

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Find the user
3. Click on their email
4. Click **Confirm email** button

## Production Setup

For production, you should:
1. Enable email confirmations in Supabase settings
2. Configure SMTP settings (Go to Settings → Auth → SMTP Settings)
3. Add your email provider credentials
4. Customize email templates if needed

## Testing Email Flow

1. Sign up with a new account
2. Check your email (including spam folder)
3. Click the verification link
4. You should be redirected to `/signin?verified=true`

## Troubleshooting

- **No emails received**: Check Supabase email logs in Dashboard → Logs → Email
- **Emails going to spam**: Configure SPF/DKIM records for your domain
- **Email provider issues**: Use a service like SendGrid, Mailgun, or AWS SES
