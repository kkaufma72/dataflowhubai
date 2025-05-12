/*
  # Add user_id to projects and set up RLS
  
  1. Changes
    - Add user_id column if it doesn't exist
    - Set a default value for user_id on existing rows
    - Make user_id NOT NULL after setting values
    - Set up RLS policies for project ownership
*/

-- Check if user_id column exists and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Set a default user_id for existing rows
-- First, get a valid user_id from auth.users
DO $$
DECLARE
  default_user_id UUID;
BEGIN
  -- Get the first user_id from auth.users
  SELECT id INTO default_user_id FROM auth.users LIMIT 1;
  
  -- If we found a user, update all null user_id values
  IF default_user_id IS NOT NULL THEN
    UPDATE public.projects SET user_id = default_user_id WHERE user_id IS NULL;
  ELSE
    -- If no users exist yet, we need to handle this differently
    -- For development purposes, we can use a placeholder UUID
    UPDATE public.projects SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
  END IF;
END $$;

-- Now make the column NOT NULL
ALTER TABLE public.projects ALTER COLUMN user_id SET NOT NULL;

-- Enable RLS if not already enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Create policies
CREATE POLICY "Users can view their own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);