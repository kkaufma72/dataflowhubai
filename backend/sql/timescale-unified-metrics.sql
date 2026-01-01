-- TimescaleDB Unified Metrics Schema
-- Consolidates all time-series metrics into optimized hypertables with compression and retention

-- Drop existing tables if we're recreating (comment out for production migration)
-- DROP TABLE IF EXISTS model_metrics CASCADE;
-- DROP TABLE IF EXISTS dataset_metrics CASCADE;
-- DROP TABLE IF EXISTS system_metrics CASCADE;
-- DROP TABLE IF EXISTS prediction_logs CASCADE;
-- DROP TABLE IF EXISTS training_metrics CASCADE;

-- ============================================================================
-- Unified Metrics Table
-- Mirrors InfluxDB bucket schema: metric(entity_id, ts, name, value, tags)
-- ============================================================================

CREATE TABLE IF NOT EXISTS unified_metrics (
    time TIMESTAMPTZ NOT NULL,
    entity_type VARCHAR(50) NOT NULL,      -- 'model', 'dataset', 'system', 'training'
    entity_id UUID NOT NULL,                -- model_id, dataset_id, service identifier
    metric_name VARCHAR(255) NOT NULL,      -- accuracy, loss, quality_score, etc.
    metric_value DOUBLE PRECISION NOT NULL,
    tags JSONB DEFAULT '{}'::jsonb,         -- Flexible tags: {environment, version, user_id, etc}
    
    PRIMARY KEY (time, entity_type, entity_id, metric_name)
);

-- Create hypertable with 7-day chunks
SELECT create_hypertable(
    'unified_metrics',
    'time',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_unified_metrics_entity ON unified_metrics (entity_type, entity_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_unified_metrics_name ON unified_metrics (entity_type, metric_name, time DESC);
CREATE INDEX IF NOT EXISTS idx_unified_metrics_tags ON unified_metrics USING GIN (tags);

-- ============================================================================
-- Prediction Logs (high-volume, separate table for optimal chunking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prediction_logs (
    time TIMESTAMPTZ NOT NULL,
    prediction_id UUID NOT NULL,
    model_id UUID NOT NULL,
    user_id UUID,
    input_data JSONB NOT NULL,
    prediction JSONB NOT NULL,
    confidence_score DOUBLE PRECISION,
    response_time_ms DOUBLE PRECISION NOT NULL,
    error TEXT,
    tags JSONB DEFAULT '{}'::jsonb,         -- environment, version, experiment_id
    
    PRIMARY KEY (time, prediction_id)
);

-- Create hypertable with 1-day chunks (high volume)
SELECT create_hypertable(
    'prediction_logs',
    'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Indexes for prediction queries
CREATE INDEX IF NOT EXISTS idx_prediction_logs_model ON prediction_logs (model_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_user ON prediction_logs (user_id, time DESC) WHERE user_id IS NOT NULL;

-- ============================================================================
-- Compression Policies (10x storage reduction)
-- ============================================================================

-- Enable compression on unified_metrics (compress data older than 7 days)
ALTER TABLE unified_metrics SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'entity_type, entity_id, metric_name',
    timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy(
    'unified_metrics',
    INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Enable compression on prediction_logs (compress data older than 3 days)
ALTER TABLE prediction_logs SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'model_id',
    timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy(
    'prediction_logs',
    INTERVAL '3 days',
    if_not_exists => TRUE
);

-- ============================================================================
-- Retention Policies (automatic data cleanup)
-- ============================================================================

-- Drop unified_metrics older than 90 days
SELECT add_retention_policy(
    'unified_metrics',
    INTERVAL '90 days',
    if_not_exists => TRUE
);

-- Drop prediction_logs older than 30 days (high volume, shorter retention)
SELECT add_retention_policy(
    'prediction_logs',
    INTERVAL '30 days',
    if_not_exists => TRUE
);

-- ============================================================================
-- Continuous Aggregates (pre-computed rollups for fast queries)
-- ============================================================================

-- Hourly model metrics aggregate
CREATE MATERIALIZED VIEW IF NOT EXISTS model_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    entity_id AS model_id,
    metric_name,
    AVG(metric_value) AS avg_value,
    MIN(metric_value) AS min_value,
    MAX(metric_value) AS max_value,
    COUNT(*) AS count
FROM unified_metrics
WHERE entity_type = 'model'
GROUP BY bucket, entity_id, metric_name;

-- Refresh policy for hourly aggregate
SELECT add_continuous_aggregate_policy(
    'model_metrics_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Daily dataset quality aggregate
CREATE MATERIALIZED VIEW IF NOT EXISTS dataset_metrics_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    entity_id AS dataset_id,
    metric_name,
    AVG(metric_value) AS avg_value,
    MIN(metric_value) AS min_value,
    MAX(metric_value) AS max_value,
    COUNT(*) AS count
FROM unified_metrics
WHERE entity_type = 'dataset'
GROUP BY bucket, entity_id, metric_name;

SELECT add_continuous_aggregate_policy(
    'dataset_metrics_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- ============================================================================
-- Helper Views (backward compatibility with existing queries)
-- ============================================================================

-- View: model_metrics (for backward compatibility)
CREATE OR REPLACE VIEW model_metrics AS
SELECT
    time,
    entity_id AS model_id,
    metric_name,
    metric_value,
    tags AS meta_data
FROM unified_metrics
WHERE entity_type = 'model';

-- View: dataset_metrics
CREATE OR REPLACE VIEW dataset_metrics AS
SELECT
    time,
    entity_id AS dataset_id,
    metric_name,
    metric_value,
    tags AS meta_data
FROM unified_metrics
WHERE entity_type = 'dataset';

-- View: system_metrics
CREATE OR REPLACE VIEW system_metrics AS
SELECT
    time,
    tags->>'service_name' AS service_name,
    metric_name,
    metric_value,
    tags AS meta_data
FROM unified_metrics
WHERE entity_type = 'system';

-- View: training_metrics
CREATE OR REPLACE VIEW training_metrics AS
SELECT
    time,
    entity_id AS model_id,
    (tags->>'epoch')::numeric AS epoch,
    metric_name,
    metric_value,
    tags AS meta_data
FROM unified_metrics
WHERE entity_type = 'training';

-- ============================================================================
-- Grants (ensure application user has access)
-- ============================================================================

GRANT SELECT, INSERT ON unified_metrics TO tsdata_user;
GRANT SELECT, INSERT ON prediction_logs TO tsdata_user;
GRANT SELECT ON model_metrics_hourly TO tsdata_user;
GRANT SELECT ON dataset_metrics_daily TO tsdata_user;
GRANT SELECT ON model_metrics TO tsdata_user;
GRANT SELECT ON dataset_metrics TO tsdata_user;
GRANT SELECT ON system_metrics TO tsdata_user;
GRANT SELECT ON training_metrics TO tsdata_user;

-- ============================================================================
-- Performance Stats Query (run periodically to monitor)
-- ============================================================================

-- Check compression stats
-- SELECT
--     hypertable_name,
--     pg_size_pretty(before_compression_total_bytes) AS before_compression,
--     pg_size_pretty(after_compression_total_bytes) AS after_compression,
--     ROUND((100.0 * after_compression_total_bytes) / NULLIF(before_compression_total_bytes, 0), 2) AS compression_ratio_percent
-- FROM timescaledb_information.compression_settings;

-- Check chunk stats
-- SELECT
--     hypertable_name,
--     num_chunks,
--     num_compressed_chunks,
--     pg_size_pretty(total_bytes) AS total_size
-- FROM timescaledb_information.hypertables
-- ORDER BY total_bytes DESC;
