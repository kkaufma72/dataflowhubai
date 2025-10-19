/*
  # Add social_links column to user_profiles table
  
  1. Changes
    - Add social_links column to user_profiles table if it doesn't exist
    - Set default value to empty JSON object
    - Make column nullable
  
  2. Purpose
    - Fix error: "Could not find the 'social_links' column of 'user_profiles' in the schema cache"
    - Ensure compatibility with UserContext.tsx which expects this column
*/

-- Check if social_links column exists and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'social_links'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;