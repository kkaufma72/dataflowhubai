-- Enable RLS on dataset_knowledge table
ALTER TABLE dataset_knowledge ENABLE ROW LEVEL SECURITY;

-- Grant standard privileges to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON dataset_knowledge TO authenticated;

-- Policy: Users can view knowledge for their own datasets
CREATE POLICY "Users can view own dataset knowledge"
ON dataset_knowledge FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_knowledge.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

-- Policy: Users can insert knowledge for their own datasets
CREATE POLICY "Users can insert own dataset knowledge"
ON dataset_knowledge FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_knowledge.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

-- Policy: Users can update knowledge for their own datasets
CREATE POLICY "Users can update own dataset knowledge"
ON dataset_knowledge FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_knowledge.dataset_id
    AND datasets.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_knowledge.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

-- Policy: Users can delete knowledge for their own datasets
CREATE POLICY "Users can delete own dataset knowledge"
ON dataset_knowledge FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_knowledge.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

-- Add index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_dataset_knowledge_dataset_id ON dataset_knowledge(dataset_id);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'dataset_knowledge'
ORDER BY policyname;
