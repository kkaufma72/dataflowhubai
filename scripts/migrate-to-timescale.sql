-- TimescaleDB Migration: Consolidate InfluxDB metrics into TimescaleDB hypertables
-- Run this script in timescaledb container: docker exec -i dataflow_timescaledb psql -U postgres -d timescale < migrate-to-timescale.sql

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Disable telemetry
ALTER SYSTEM SET timescaledb.telemetry_level = 'off';
SELECT pg_reload_conf();

-- Create unified metrics hypertable
CREATE TABLE IF NOT EXISTS metrics (
    time TIMESTAMPTZ NOT NULL,
    model_id TEXT,
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION,
    tags JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create hypertable with 6-hour chunks (optimized for your ingestion pattern)
SELECT create_hypertable('metrics', 'time', 
    chunk_time_interval => INTERVAL '6 hours',
    if_not_exists => TRUE
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_metrics_model_id ON metrics(model_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name, time DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_tags ON metrics USING GIN(tags);

-- Create model performance metrics table
CREATE TABLE IF NOT EXISTS model_performance (
    time TIMESTAMPTZ NOT NULL,
    model_id TEXT NOT NULL,
    accuracy DOUBLE PRECISION,
    precision_score DOUBLE PRECISION,
    recall DOUBLE PRECISION,
    f1_score DOUBLE PRECISION,
    auc_roc DOUBLE PRECISION,
    inference_time_ms DOUBLE PRECISION,
    throughput_qps DOUBLE PRECISION,
    metadata JSONB DEFAULT '{}'::jsonb
);

SELECT create_hypertable('model_performance', 'time',
    chunk_time_interval => INTERVAL '6 hours',
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_model_perf_model_id ON model_performance(model_id, time DESC);

-- Create system metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    time TIMESTAMPTZ NOT NULL,
    host TEXT,
    metric_type TEXT NOT NULL, -- cpu, memory, disk, network
    metric_value DOUBLE PRECISION,
    unit TEXT,
    tags JSONB DEFAULT '{}'::jsonb
);

SELECT create_hypertable('system_metrics', 'time',
    chunk_time_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type, time DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_host ON system_metrics(host, time DESC);

-- Create training metrics table
CREATE TABLE IF NOT EXISTS training_metrics (
    time TIMESTAMPTZ NOT NULL,
    experiment_id TEXT NOT NULL,
    model_id TEXT,
    epoch INTEGER,
    step INTEGER,
    loss DOUBLE PRECISION,
    validation_loss DOUBLE PRECISION,
    learning_rate DOUBLE PRECISION,
    batch_size INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb
);

SELECT create_hypertable('training_metrics', 'time',
    chunk_time_interval => INTERVAL '12 hours',
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_training_exp_id ON training_metrics(experiment_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_training_model_id ON training_metrics(model_id, time DESC);

-- Create data quality metrics table
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    time TIMESTAMPTZ NOT NULL,
    dataset_id TEXT NOT NULL,
    completeness DOUBLE PRECISION,
    validity DOUBLE PRECISION,
    consistency DOUBLE PRECISION,
    uniqueness DOUBLE PRECISION,
    timeliness DOUBLE PRECISION,
    row_count BIGINT,
    null_count BIGINT,
    duplicate_count BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb
);

SELECT create_hypertable('data_quality_metrics', 'time',
    chunk_time_interval => INTERVAL '24 hours',
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_dq_dataset_id ON data_quality_metrics(dataset_id, time DESC);

-- Enable compression on all hypertables (after 7 days)
SELECT add_compression_policy('metrics', INTERVAL '7 days');
SELECT add_compression_policy('model_performance', INTERVAL '7 days');
SELECT add_compression_policy('system_metrics', INTERVAL '3 days');
SELECT add_compression_policy('training_metrics', INTERVAL '7 days');
SELECT add_compression_policy('data_quality_metrics', INTERVAL '7 days');

-- Add retention policies (drop data older than 90 days)
SELECT add_retention_policy('metrics', INTERVAL '90 days');
SELECT add_retention_policy('model_performance', INTERVAL '90 days');
SELECT add_retention_policy('system_metrics', INTERVAL '30 days');
SELECT add_retention_policy('training_metrics', INTERVAL '90 days');
SELECT add_retention_policy('data_quality_metrics', INTERVAL '90 days');

-- Add reorder policies for better compression
SELECT add_reorder_policy('metrics', 'idx_metrics_model_id');
SELECT add_reorder_policy('model_performance', 'idx_model_perf_model_id');
SELECT add_reorder_policy('training_metrics', 'idx_training_exp_id');

-- Create continuous aggregates for common queries
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    model_id,
    metric_name,
    AVG(metric_value) AS avg_value,
    MIN(metric_value) AS min_value,
    MAX(metric_value) AS max_value,
    COUNT(*) AS count
FROM metrics
GROUP BY bucket, model_id, metric_name;

CREATE MATERIALIZED VIEW IF NOT EXISTS model_performance_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    model_id,
    AVG(accuracy) AS avg_accuracy,
    AVG(f1_score) AS avg_f1,
    AVG(inference_time_ms) AS avg_inference_ms,
    AVG(throughput_qps) AS avg_throughput,
    COUNT(*) AS samples
FROM model_performance
GROUP BY bucket, model_id;

-- Add refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('metrics_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('model_performance_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;

-- Optimize configuration
ALTER SYSTEM SET shared_preload_libraries = 'timescaledb';
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET effective_cache_size = '4GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Show configuration summary
SELECT format('
TimescaleDB Migration Complete!

Created hypertables:
- metrics (6h chunks, 90d retention, 7d compression)
- model_performance (6h chunks, 90d retention, 7d compression)
- system_metrics (1h chunks, 30d retention, 3d compression)
- training_metrics (12h chunks, 90d retention, 7d compression)
- data_quality_metrics (24h chunks, 90d retention, 7d compression)

Continuous aggregates:
- metrics_hourly (refreshed every hour)
- model_performance_daily (refreshed daily)

Next steps:
1. Run: docker-compose restart timescaledb
2. Update backend to use TimescaleDB client
3. Migrate historical data from InfluxDB (if needed)
4. Remove InfluxDB from docker-compose.yml
') AS summary;
