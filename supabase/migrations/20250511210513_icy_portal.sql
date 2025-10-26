/*
  # Add full_name column to user_profiles table

  1. Changes
    - Add full_name column to user_profiles table
    - Set default value to empty string
    - Make column nullable to handle existing records
*/

-- Add full_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN full_name TEXT DEFAULT '';
  END IF;
END $$;