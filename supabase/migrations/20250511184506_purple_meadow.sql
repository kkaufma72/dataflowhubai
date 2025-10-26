/*
  # Fix RLS Policies for Projects and Datasets
  
  1. Changes
    - Drop all existing policies
    - Add proper authentication checks
    - Enable RLS on both tables
    - Ensure user_id is properly handled
    
  2. Security
    - Restrict access to authenticated users only
    - Maintain data isolation between users
    - Associate datasets with authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "allow_public_read_projects" ON projects;
DROP POLICY IF EXISTS "allow_public_create_projects" ON projects;
DROP POLICY IF EXISTS "allow_authenticated_update_projects" ON projects;
DROP POLICY IF EXISTS "allow_public_delete_projects" ON projects;
DROP POLICY IF EXISTS "allow_public_create_datasets" ON datasets;
DROP POLICY IF EXISTS "allow_public_read_datasets" ON datasets;
DROP POLICY IF EXISTS "allow_public_update_datasets" ON datasets;
DROP POLICY IF EXISTS "allow_public_delete_datasets" ON datasets;

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- Projects policies for authenticated users
CREATE POLICY "authenticated_users_create_projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_read_projects"
ON projects FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_update_projects"
ON projects FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_delete_projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Datasets policies for authenticated users
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