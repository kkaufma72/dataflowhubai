-- Add soft delete columns to existing tables
ALTER TABLE IF EXISTS datasets
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE IF EXISTS models
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create trash_bin table for tracking deleted items
CREATE TABLE IF NOT EXISTS trash_bin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('dataset', 'model', 'pipeline', 'deployment')),
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_data JSONB,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  restored_at TIMESTAMP WITH TIME ZONE,
  permanently_deleted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trash_bin_user_id ON trash_bin(user_id);
CREATE INDEX IF NOT EXISTS idx_trash_bin_item_type ON trash_bin(item_type);
CREATE INDEX IF NOT EXISTS idx_trash_bin_deleted_at ON trash_bin(deleted_at);
CREATE INDEX IF NOT EXISTS idx_trash_bin_expires_at ON trash_bin(expires_at);
CREATE INDEX IF NOT EXISTS idx_datasets_deleted_at ON datasets(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_models_deleted_at ON models(deleted_at) WHERE deleted_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE trash_bin ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trash_bin
CREATE POLICY "Users can view their own trash items"
  ON trash_bin FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trash items"
  ON trash_bin FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trash items"
  ON trash_bin FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trash items"
  ON trash_bin FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically move items to trash
CREATE OR REPLACE FUNCTION move_to_trash()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into trash_bin
  INSERT INTO trash_bin (
    user_id,
    item_type,
    item_id,
    item_name,
    item_data,
    deleted_at,
    expires_at
  ) VALUES (
    NEW.deleted_by,
    TG_TABLE_NAME::TEXT,
    NEW.id::TEXT,
    COALESCE(NEW.name, 'Unnamed Item'),
    row_to_json(OLD),
    NEW.deleted_at,
    NEW.deleted_at + INTERVAL '30 days'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-moving to trash (optional - manual control might be better)
-- Uncomment if you want automatic trash_bin population
-- CREATE TRIGGER dataset_deleted_trigger
--   AFTER UPDATE OF deleted_at ON datasets
--   FOR EACH ROW
--   WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
--   EXECUTE FUNCTION move_to_trash();

-- CREATE TRIGGER model_deleted_trigger
--   AFTER UPDATE OF deleted_at ON models
--   FOR EACH ROW
--   WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
--   EXECUTE FUNCTION move_to_trash();

-- Function to permanently delete expired trash items
CREATE OR REPLACE FUNCTION cleanup_expired_trash()
RETURNS void AS $$
BEGIN
  -- Mark items as permanently deleted
  UPDATE trash_bin
  SET permanently_deleted_at = NOW()
  WHERE expires_at < NOW()
    AND restored_at IS NULL
    AND permanently_deleted_at IS NULL;

  -- Optionally delete the records (keep for audit trail)
  -- DELETE FROM trash_bin
  -- WHERE permanently_deleted_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to restore items from trash
CREATE OR REPLACE FUNCTION restore_from_trash(trash_item_id UUID)
RETURNS boolean AS $$
DECLARE
  trash_item RECORD;
BEGIN
  -- Get the trash item
  SELECT * INTO trash_item
  FROM trash_bin
  WHERE id = trash_item_id
    AND user_id = auth.uid()
    AND restored_at IS NULL
    AND permanently_deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Restore based on item type
  IF trash_item.item_type = 'dataset' THEN
    UPDATE datasets
    SET deleted_at = NULL, deleted_by = NULL
    WHERE id = trash_item.item_id::UUID;
  ELSIF trash_item.item_type = 'model' THEN
    UPDATE models
    SET deleted_at = NULL, deleted_by = NULL
    WHERE id = trash_item.item_id::UUID;
  END IF;

  -- Mark as restored in trash_bin
  UPDATE trash_bin
  SET restored_at = NOW()
  WHERE id = trash_item_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up expired trash (requires pg_cron extension)
-- This is optional and requires superuser privileges
-- SELECT cron.schedule('cleanup-expired-trash', '0 2 * * *', $$SELECT cleanup_expired_trash()$$);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION restore_from_trash(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_trash() TO authenticated;

COMMENT ON TABLE trash_bin IS 'Soft delete trash bin with 30-day retention';
COMMENT ON COLUMN trash_bin.expires_at IS 'Auto-delete after this date (30 days from deletion)';
COMMENT ON FUNCTION restore_from_trash IS 'Restore a deleted item from trash';
COMMENT ON FUNCTION cleanup_expired_trash IS 'Permanently delete expired trash items (run daily)';
