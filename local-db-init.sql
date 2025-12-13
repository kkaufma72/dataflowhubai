-- Local PostgreSQL Schema for DataFlowHub
-- This mirrors the Supabase schema for local development

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Datasets table (main table for FRED imports)
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL DEFAULT 'json',
  file_size TEXT DEFAULT '0 KB',
  row_count INTEGER DEFAULT 0,
  column_count INTEGER DEFAULT 0,
  rows INTEGER DEFAULT 0,
  columns INTEGER DEFAULT 0,
  preview_data JSONB DEFAULT '{}',
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID,
  source TEXT DEFAULT 'upload',
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  size_mb TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ML Models table
CREATE TABLE IF NOT EXISTS ml_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  model_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID,
  hyperparameters JSONB DEFAULT '{}',
  training_config JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  email TEXT,
  full_name TEXT,
  company TEXT,
  job_title TEXT,
  use_case TEXT,
  tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations table (for AI chat history)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]',
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- ModelOps / Autopilot tables
-- =========================

-- Drift reports (stored as JSON for flexibility)
CREATE TABLE IF NOT EXISTS model_drift_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  user_id UUID,
  has_drift BOOLEAN NOT NULL DEFAULT FALSE,
  drift_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'info',
  report JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incidents opened from drift/performance issues
CREATE TABLE IF NOT EXISTS model_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  drift_report_id UUID REFERENCES model_drift_reports(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open',
  severity TEXT NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Autopilot policies (per user; JSON config)
CREATE TABLE IF NOT EXISTS autopilot_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_project_id ON datasets(project_id);
CREATE INDEX IF NOT EXISTS idx_datasets_source ON datasets(source);
CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_models_user_id ON ml_models(user_id);
CREATE INDEX IF NOT EXISTS idx_models_dataset_id ON ml_models(dataset_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- ModelOps indexes
CREATE INDEX IF NOT EXISTS idx_model_drift_reports_model_id ON model_drift_reports(model_id);
CREATE INDEX IF NOT EXISTS idx_model_drift_reports_created_at ON model_drift_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_incidents_model_id ON model_incidents(model_id);
CREATE INDEX IF NOT EXISTS idx_model_incidents_status ON model_incidents(status);
CREATE INDEX IF NOT EXISTS idx_autopilot_policies_user_id ON autopilot_policies(user_id);

-- Trigger to sync rows/columns with row_count/column_count
CREATE OR REPLACE FUNCTION sync_dataset_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.row_count IS NULL AND NEW.rows IS NOT NULL THEN
    NEW.row_count = NEW.rows;
  ELSIF NEW.rows IS NULL AND NEW.row_count IS NOT NULL THEN
    NEW.rows = NEW.row_count;
  END IF;
  
  IF NEW.column_count IS NULL AND NEW.columns IS NOT NULL THEN
    NEW.column_count = NEW.columns;
  ELSIF NEW.columns IS NULL AND NEW.column_count IS NOT NULL THEN
    NEW.columns = NEW.column_count;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_dataset_counts_trigger ON datasets;
CREATE TRIGGER sync_dataset_counts_trigger
BEFORE INSERT OR UPDATE ON datasets
FOR EACH ROW EXECUTE FUNCTION sync_dataset_counts();

-- Create a default project for testing
INSERT INTO projects (id, name, description, user_id)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Default Project',
  'Local development project',
  'a0000000-0000-0000-0000-000000000000'
) ON CONFLICT (id) DO NOTHING;

-- Create a test user profile
INSERT INTO user_profiles (id, user_id, email, full_name)
VALUES (
  'a0000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000000',
  'local@test.com',
  'Local Test User'
) ON CONFLICT (user_id) DO NOTHING;

-- Create a default autopilot policy for local dev
INSERT INTO autopilot_policies (user_id, name, enabled, config)
VALUES (
  'a0000000-0000-0000-0000-000000000000',
  'Default Autopilot Policy',
  TRUE,
  '{
    "thresholds": {"warning": 0.20, "critical": 0.40},
    "auto_open_incident": true
  }'
) ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Local database schema created successfully!';
  RAISE NOTICE '📊 Tables: projects, datasets, ml_models, user_profiles, conversations, model_drift_reports, model_incidents, autopilot_policies';
  RAISE NOTICE '🎯 Ready for FRED imports!';
END $$;

