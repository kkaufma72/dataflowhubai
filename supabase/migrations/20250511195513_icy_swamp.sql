/*
  # Add user_id column to models table

  1. Changes
    - Add `user_id` column to `models` table
    - Add foreign key constraint to reference auth.users table
    - Add index on user_id for better query performance
    - Update RLS policies to restrict access based on user_id

  2. Security
    - Enable RLS on models table (already enabled)
    - Add policy for users to manage their own models
*/

-- Add user_id column
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);

-- Update RLS policies
DROP POLICY IF EXISTS "allow_public_access_models" ON models;

CREATE POLICY "users_manage_own_models"
ON models
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Backfill existing rows with the project owner's user_id
UPDATE models m
SET user_id = p.user_id
FROM projects p
WHERE m.project_id = p.id
AND m.user_id IS NULL;