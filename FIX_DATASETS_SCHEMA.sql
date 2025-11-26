-- ===========================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Dashboard -> SQL Editor -> New Query -> Paste this -> Run
-- ===========================================

-- Add 'source' column for tracking data source (e.g., 'FRED', 'upload', etc.)
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'upload';

-- Add 'metadata' column for storing additional metadata (e.g., FRED series info)
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add 'tags' column for categorization
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add 'size_mb' column for file size in MB
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS size_mb text;

-- Add 'user_id' column if not exists (for RLS)
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add 'rows' as alias column (mirrors row_count)
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS rows integer;

-- Add 'columns' as alias column (mirrors column_count)
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS columns integer;

-- Make row_count and column_count nullable for new insert pattern
ALTER TABLE datasets ALTER COLUMN row_count DROP NOT NULL;
ALTER TABLE datasets ALTER COLUMN column_count DROP NOT NULL;

-- Update existing rows to sync row_count -> rows and column_count -> columns
UPDATE datasets 
SET rows = row_count, columns = column_count 
WHERE rows IS NULL OR columns IS NULL;

-- Create trigger to keep rows/columns in sync with row_count/column_count
CREATE OR REPLACE FUNCTION ensure_dataset_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure row_count has a value
  IF NEW.row_count IS NULL AND NEW.rows IS NOT NULL THEN
    NEW.row_count = NEW.rows;
  ELSIF NEW.row_count IS NULL THEN
    NEW.row_count = 0;
  END IF;
  
  -- Ensure column_count has a value
  IF NEW.column_count IS NULL AND NEW.columns IS NOT NULL THEN
    NEW.column_count = NEW.columns;
  ELSIF NEW.column_count IS NULL THEN
    NEW.column_count = 0;
  END IF;
  
  -- Sync the aliases
  NEW.rows = NEW.row_count;
  NEW.columns = NEW.column_count;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_dataset_counts_trigger ON datasets;

CREATE TRIGGER ensure_dataset_counts_trigger
BEFORE INSERT OR UPDATE ON datasets
FOR EACH ROW
EXECUTE FUNCTION ensure_dataset_counts();

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_datasets_source ON datasets(source);
CREATE INDEX IF NOT EXISTS idx_datasets_tags ON datasets USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);

-- Update RLS policy to be more secure
DROP POLICY IF EXISTS "Allow authenticated users to manage datasets" ON datasets;
DROP POLICY IF EXISTS "Users can manage own datasets" ON datasets;

CREATE POLICY "Users can manage own datasets"
  ON datasets
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR user_id IS NULL -- Allow legacy datasets without user_id
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR user_id IS NULL
  );

-- ===========================================
-- SUCCESS! The datasets table now supports:
-- - rows/columns (aliases for row_count/column_count)
-- - source (e.g., 'FRED', 'upload')
-- - metadata (JSONB for extra info)
-- - tags (array of strings)
-- - size_mb (file size)
-- - user_id (for row-level security)
-- ===========================================

