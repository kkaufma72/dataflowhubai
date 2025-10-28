-- Data Warehouse Schema Initialization
-- Run this when creating your PostgreSQL warehouse

-- Dataset Dimension Table
CREATE TABLE IF NOT EXISTS dim_datasets (
  dataset_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ,
  last_analyzed_at TIMESTAMPTZ,
  total_rows BIGINT,
  total_columns INT,
  file_size_bytes BIGINT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User Dimension Table
CREATE TABLE IF NOT EXISTS dim_users (
  user_id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company TEXT,
  job_title TEXT,
  use_case TEXT,
  signup_date TIMESTAMPTZ,
  last_active TIMESTAMPTZ,
  total_datasets INT DEFAULT 0,
  total_analyses INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Analysis Events Fact Table
CREATE TABLE IF NOT EXISTS fact_analysis_events (
  event_id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  dataset_id UUID,
  event_type TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INT DEFAULT 0,
  success BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Daily Usage Aggregations
CREATE TABLE IF NOT EXISTS agg_daily_usage (
  date DATE PRIMARY KEY,
  total_uploads INT DEFAULT 0,
  total_analyses INT DEFAULT 0,
  total_ai_chats INT DEFAULT 0,
  total_model_trains INT DEFAULT 0,
  unique_users INT DEFAULT 0,
  total_rows_processed BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dataset Health Snapshots
CREATE TABLE IF NOT EXISTS fact_dataset_health (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID,
  snapshot_date TIMESTAMPTZ DEFAULT NOW(),
  health_score INT,
  missing_values_pct DECIMAL(5,2),
  duplicate_rows_pct DECIMAL(5,2),
  outliers_count INT DEFAULT 0,
  quality_grade TEXT,
  recommendations JSONB DEFAULT '{}'::jsonb
);

-- ML Model Performance Tracking
CREATE TABLE IF NOT EXISTS fact_model_performance (
  id BIGSERIAL PRIMARY KEY,
  model_id TEXT,
  model_name TEXT,
  dataset_id UUID,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  accuracy DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall_score DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  training_time_sec INT,
  hyperparameters JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_analysis_events_user ON fact_analysis_events(user_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_events_dataset ON fact_analysis_events(dataset_id);
CREATE INDEX IF NOT EXISTS idx_analysis_events_type ON fact_analysis_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analysis_events_timestamp ON fact_analysis_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_dataset_health_date ON fact_dataset_health(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_dataset_health_dataset ON fact_dataset_health(dataset_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_model_performance_date ON fact_model_performance(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON agg_daily_usage(date DESC);

-- Comments
COMMENT ON TABLE dim_datasets IS 'Dataset dimension - master data about datasets';
COMMENT ON TABLE dim_users IS 'User dimension - master data about users';
COMMENT ON TABLE fact_analysis_events IS 'Fact table - all user actions and events';
COMMENT ON TABLE agg_daily_usage IS 'Pre-aggregated daily usage statistics';
COMMENT ON TABLE fact_dataset_health IS 'Dataset quality metrics over time';
COMMENT ON TABLE fact_model_performance IS 'ML model performance tracking';

-- Sample data for testing
INSERT INTO dim_datasets (dataset_id, name, file_type, created_at, total_rows, total_columns)
VALUES 
  (gen_random_uuid(), 'Sample Customer Data', 'csv', NOW() - INTERVAL '5 days', 1250, 15),
  (gen_random_uuid(), 'Sample Sales Data', 'excel', NOW() - INTERVAL '3 days', 850, 8),
  (gen_random_uuid(), 'Sample Marketing Data', 'json', NOW() - INTERVAL '1 day', 3200, 22)
ON CONFLICT DO NOTHING;

INSERT INTO agg_daily_usage (date, total_uploads, total_analyses, total_ai_chats, unique_users)
VALUES 
  (CURRENT_DATE - 1, 5, 12, 8, 3),
  (CURRENT_DATE - 2, 3, 8, 5, 2),
  (CURRENT_DATE - 3, 7, 15, 10, 4)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Data Warehouse schema created successfully!';
  RAISE NOTICE '📊 Tables: dim_datasets, dim_users, fact_analysis_events';
  RAISE NOTICE '🎯 Ready for analytics queries!';
END $$;

