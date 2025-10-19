/*
  # Fix Models Table User ID Column
  
  1. Changes
    - Add user_id column to models table if it doesn't exist
    - Create index on user_id column for better query performance
    - Backfill existing models with project owner's user_id
    - Update RLS policies to properly restrict access based on user_id
  
  2. Security
    - Ensures proper data isolation between users
    - Each user can only see and manage their own models
*/

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'models' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.models ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);

-- Backfill existing models with project owner's user_id
UPDATE models m
SET user_id = p.user_id
FROM projects p
WHERE m.project_id = p.id
AND m.user_id IS NULL;

-- Enable RLS
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_public_access_models" ON models;
DROP POLICY IF EXISTS "users_manage_own_models" ON models;
DROP POLICY IF EXISTS "Users can manage their own models" ON models;

-- Create new policies
CREATE POLICY "users_manage_own_models"
ON models
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);