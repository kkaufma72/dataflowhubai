-- Disable email confirmation requirement for development
-- This allows users to sign up and immediately sign in without email verification

-- Update auth users table to mark email as confirmed
-- Note: This is for development only. Remove in production!
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Also update the auth configuration (if needed)
-- Note: This requires super admin access in Supabase

