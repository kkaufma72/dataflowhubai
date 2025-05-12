/*
  # Add website column to user_profiles table
  
  1. Changes
    - Add website column to user_profiles table if it doesn't exist
    - Set default value to null
    - Make column nullable
  
  2. Purpose
    - Fix error: "Could not find the 'website' column of 'user_profiles' in the schema cache"
    - Ensure compatibility with UserContext.tsx which expects this column
*/

-- Check if website column exists and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'website'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN website text DEFAULT NULL;
  END IF;
END $$;