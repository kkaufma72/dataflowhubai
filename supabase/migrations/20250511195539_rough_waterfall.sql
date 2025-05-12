/*
  # Add user_id column to models table

  1. Changes
    - Add user_id column to models table
    - Add foreign key constraint to auth.users
    - Add index for performance
    - Add RLS policy for user access control

  2. Security
    - Enable RLS on models table if not already enabled
    - Add policy to ensure users can only access their own models
*/

-- Add user_id column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'models' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE models ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);

-- Enable RLS if not already enabled
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own models" ON models;

-- Create policy to allow users to manage their own models
CREATE POLICY "Users can manage their own models"
ON models
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);