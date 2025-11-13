/*
  # Make project_id optional for datasets and models
  
  This migration removes the project requirement, allowing users to 
  import data directly without creating/selecting a project first.
  
  1. Changes
    - Make project_id nullable in datasets table
    - Make project_id nullable in models table
    - Update existing records to set project_id to NULL if needed
    - Keep foreign key constraints but allow NULL values
  
  2. Security
    - RLS policies remain unchanged
    - Users can still access their own data via user_id
*/

-- Make project_id nullable in datasets
ALTER TABLE datasets 
ALTER COLUMN project_id DROP NOT NULL;

-- Make project_id nullable in models
ALTER TABLE models 
ALTER COLUMN project_id DROP NOT NULL;

-- Add comment to clarify the change
COMMENT ON COLUMN datasets.project_id IS 'Optional project association. Can be NULL for datasets not tied to a specific project.';
COMMENT ON COLUMN models.project_id IS 'Optional project association. Can be NULL for models not tied to a specific project.';
