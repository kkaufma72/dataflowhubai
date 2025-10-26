/*
  # Add avatar_url to user_profiles

  1. Changes
    - Add avatar_url column to user_profiles table
    - Make it nullable since not all users will have an avatar
    - Add default value as null

  2. Security
    - No changes to RLS policies needed
*/

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL;