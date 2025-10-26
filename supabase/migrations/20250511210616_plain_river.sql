/*
  # Add full_name column to user_profiles table
  
  1. Changes
    - Add full_name column to user_profiles table if it doesn't exist
    - Set default value to empty string
    - Make column nullable
  
  2. Purpose
    - Fix error: "column user_profiles.full_name does not exist"
    - Ensure compatibility with UserContext.tsx which expects this column
*/

-- Check if full_name column exists and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN full_name text DEFAULT ''::text;
  END IF;
END $$;