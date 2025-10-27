-- Fix User Profile Creation
-- Auto-create user profile when auth user is created

-- Create or replace function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user profile
  INSERT INTO public.user_profiles (
    user_id,
    email,
    full_name,
    avatar_url,
    job_title,
    company,
    bio,
    location,
    website,
    social_links,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'job_title',
    NEW.raw_user_meta_data->>'company',
    NULL,
    NULL,
    NEW.raw_user_meta_data->>'linkedin_url',
    jsonb_build_object(
      'linkedin', NEW.raw_user_meta_data->>'linkedin_url'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    job_title = COALESCE(EXCLUDED.job_title, user_profiles.job_title),
    company = COALESCE(EXCLUDED.company, user_profiles.company),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also handle updates (in case metadata changes)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates or updates user_profiles when auth.users is inserted/updated';

