# Fix "Invalid API Key" Error During Signup

## Issue
Getting "invalid API key" error when trying to sign up for an account.

## Root Cause
The Supabase API key is **valid**, but authentication is failing due to Supabase project configuration.

## Solutions (Try in order)

### 1. **Disable Email Confirmation (Recommended for Development)**

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `bcobpxgktvgfsffdsiog`
3. Navigate to **Authentication** → **Settings**
4. Find **Email Confirmations** section
5. **Disable** "Enable email confirmations"
6. Click **Save**

This allows users to sign up and sign in immediately without email verification.

### 2. **Check Email Auth Provider**

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Ensure **Email** provider is **enabled**
3. Configure these settings:
   - **Enable Email Provider**: ON
   - **Enable Email Signups**: ON
   - **Email Confirmations**: OFF (for development)
   - **Secure Email Change**: OFF (for development)

### 3. **Configure Site URL and Redirect URLs**

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3002` (for development)
3. Add **Redirect URLs**:
   ```
   http://localhost:3002/*
   http://localhost:3002/signin
   http://localhost:3002/app/auth/callback
   ```

### 4. **Check API Key Restrictions**

1. Go to **Settings** → **API**
2. Verify your **anon** (public) key matches your `.env`:
   ```
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Ensure there are no **IP restrictions** or **domain restrictions** on the key

### 5. **Enable OAuth Providers (If Using Google/GitHub Login)**

For **Google** OAuth:
1. **Authentication** → **Providers** → **Google**
2. Add Google Client ID and Secret
3. Add authorized redirect URI: `https://bcobpxgktvgfsffdsiog.supabase.co/auth/v1/callback`

For **GitHub** OAuth:
1. **Authentication** → **Providers** → **GitHub**
2. Add GitHub Client ID and Secret  
3. Add authorization callback URL: `https://bcobpxgktvgfsffdsiog.supabase.co/auth/v1/callback`

### 6. **Verify Environment Variables**

Ensure `.env` file has correct values:
```bash
VITE_SUPABASE_URL=https://bcobpxgktvgfsffdsiog.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb2JweGdrdHZnZnNmZmRzaW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDE1NDQsImV4cCI6MjA3NjQxNzU0NH0.xI0sbMYLa7ln-XcbESHr4Y9tLNzg_LLkZAySj0O5a04
```

After changing `.env`, **restart the dev server**:
```bash
# Kill existing server
kill $(lsof -ti:3002)

# Start fresh
npm run dev
```

## Testing the Fix

1. Open http://localhost:3002/signin
2. Click "Sign up"
3. Fill in the form with:
   - **Full Name**: Test User
   - **Use Case**: General Data Science
   - **Email**: your-email@gmail.com (use a real email domain)
   - **Password**: testpassword123 (min 8 chars)
4. Click "Create Account"

### Expected Behavior After Fix:
- ✅ Account created successfully
- ✅ Automatically switches to sign-in mode
- ✅ Can sign in immediately (no email verification needed)
- ✅ Redirects to /app dashboard

## Common Error Messages and Fixes

| Error Message | Fix |
|--------------|-----|
| "Invalid API key" | Disable email confirmations in Supabase |
| "Email not confirmed" | Disable email confirmation requirement |
| "User already registered" | Email already exists - try signing in instead |
| "Invalid login credentials" | Wrong password or user doesn't exist |
| "Email link is invalid or has expired" | Disable email confirmations |

## Still Having Issues?

If the error persists:

1. **Check Browser Console** for detailed error messages
2. **Check Supabase Logs**:
   - Dashboard → Logs → Auth Logs
   - Look for failed signup attempts
3. **Verify Supabase Project is Active**:
   - Check project status in Dashboard
   - Ensure billing is configured (if required)

## Quick Debug Script

Run this in browser console on http://localhost:3002:

```javascript
// Test Supabase connection
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has API Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Try a test signup
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpassword123'
});
console.log('Signup result:', { data, error });
```

## Production Checklist

Before deploying to production:

- [ ] Re-enable email confirmations
- [ ] Configure production Site URL
- [ ] Add production redirect URLs
- [ ] Enable secure email change
- [ ] Set up email templates
- [ ] Configure SMTP settings
- [ ] Enable OAuth providers with production credentials



