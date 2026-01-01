-- Migration: Add S3/MinIO storage columns to datasets and models tables
-- This enables metadata-only storage in Postgres with artifacts in S3

-- Add S3 storage columns to datasets table
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS s3_key TEXT,
  ADD COLUMN IF NOT EXISTS s3_bucket TEXT DEFAULT 'datasets',
  ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'minio' CHECK (storage_provider IN ('minio', 's3', 'gcs')),
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS checksum TEXT,
  ADD COLUMN IF NOT EXISTS storage_metadata JSONB DEFAULT '{}';

-- Add S3 storage columns to models table
ALTER TABLE models
  ADD COLUMN IF NOT EXISTS artifact_s3_key TEXT,
  ADD COLUMN IF NOT EXISTS artifact_s3_bucket TEXT DEFAULT 'models',
  ADD COLUMN IF NOT EXISTS artifact_storage_provider TEXT DEFAULT 'minio' CHECK (artifact_storage_provider IN ('minio', 's3', 'gcs')),
  ADD COLUMN IF NOT EXISTS artifact_content_type TEXT,
  ADD COLUMN IF NOT EXISTS artifact_checksum TEXT,
  ADD COLUMN IF NOT EXISTS artifact_storage_metadata JSONB DEFAULT '{}';

-- Create indexes for S3 key lookups
CREATE INDEX IF NOT EXISTS idx_datasets_s3_key ON datasets(s3_key) WHERE s3_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_models_artifact_s3_key ON models(artifact_s3_key) WHERE artifact_s3_key IS NOT NULL;

-- Add comment documentation
COMMENT ON COLUMN datasets.s3_key IS 'S3/MinIO object key for the dataset file';
COMMENT ON COLUMN datasets.s3_bucket IS 'S3 bucket name (default: datasets)';
COMMENT ON COLUMN datasets.storage_provider IS 'Storage provider: minio, s3, or gcs';
COMMENT ON COLUMN datasets.content_type IS 'MIME type of the stored file';
COMMENT ON COLUMN datasets.checksum IS 'MD5/SHA256 checksum for integrity verification';
COMMENT ON COLUMN datasets.storage_metadata IS 'Additional storage metadata (encryption, versioning, etc.)';

COMMENT ON COLUMN models.artifact_s3_key IS 'S3/MinIO object key for the model artifact';
COMMENT ON COLUMN models.artifact_s3_bucket IS 'S3 bucket name (default: models)';
COMMENT ON COLUMN models.artifact_storage_provider IS 'Storage provider: minio, s3, or gcs';
COMMENT ON COLUMN models.artifact_content_type IS 'MIME type of the stored artifact';
COMMENT ON COLUMN models.artifact_checksum IS 'MD5/SHA256 checksum for integrity verification';
COMMENT ON COLUMN models.artifact_storage_metadata IS 'Additional storage metadata (encryption, versioning, etc.)';

-- Create a helper function to generate presigned URL metadata (placeholder for app logic)
-- Actual presigned URL generation happens in application layer via MinIO client
CREATE OR REPLACE FUNCTION get_dataset_download_info(dataset_uuid UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  s3_key TEXT,
  s3_bucket TEXT,
  storage_provider TEXT,
  file_size TEXT,
  content_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.s3_key,
    d.s3_bucket,
    d.storage_provider,
    d.file_size,
    d.content_type
  FROM datasets d
  WHERE d.id = dataset_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_model_artifact_info(model_uuid UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  artifact_s3_key TEXT,
  artifact_s3_bucket TEXT,
  artifact_storage_provider TEXT,
  artifact_content_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.artifact_s3_key,
    m.artifact_s3_bucket,
    m.artifact_storage_provider,
    m.artifact_content_type
  FROM models m
  WHERE m.id = model_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
