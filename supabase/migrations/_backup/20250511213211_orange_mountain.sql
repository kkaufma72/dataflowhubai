/*
  # Add preferences column to user_profiles table

  1. Changes
    - Add preferences column to user_profiles table as JSONB
    - Set default value for preferences column
    - Make the column nullable
*/

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "theme": "light",
  "emailNotifications": true,
  "twoFactorAuth": false
}'::jsonb;