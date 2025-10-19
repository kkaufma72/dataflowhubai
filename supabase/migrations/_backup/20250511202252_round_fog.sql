/*
  # Add user_id to datasets table
  
  1. Changes
    - Add user_id column to datasets table
    - Create index for better query performance
    - Update RLS policies to use user_id
    - Backfill existing datasets with project owner's user_id
  
  2. Security
    - Ensures users can only access their own datasets
    - Maintains data isolation between users
*/

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'datasets' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.datasets ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);

-- Backfill existing datasets with project owner's user_id
UPDATE datasets d
SET user_id = p.user_id
FROM projects p
WHERE d.project_id = p.id
AND d.user_id IS NULL;

-- Enable RLS
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_public_create_datasets" ON datasets;
DROP POLICY IF EXISTS "allow_public_read_datasets" ON datasets;
DROP POLICY IF EXISTS "allow_public_update_datasets" ON datasets;
DROP POLICY IF EXISTS "allow_public_delete_datasets" ON datasets;
DROP POLICY IF EXISTS "authenticated_users_create_datasets" ON datasets;
DROP POLICY IF EXISTS "authenticated_users_read_datasets" ON datasets;
DROP POLICY IF EXISTS "authenticated_users_update_datasets" ON datasets;
DROP POLICY IF EXISTS "authenticated_users_delete_datasets" ON datasets;

-- Create new policies
CREATE POLICY "authenticated_users_create_datasets"
ON datasets FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);

CREATE POLICY "authenticated_users_read_datasets"
ON datasets FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);

CREATE POLICY "authenticated_users_update_datasets"
ON datasets FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);

CREATE POLICY "authenticated_users_delete_datasets"
ON datasets FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);