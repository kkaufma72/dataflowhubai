-- TimescaleDB initialization script
-- Creates hypertables and continuous aggregates for time-series data

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create model_metrics table and convert to hypertable
CREATE TABLE IF NOT EXISTS model_metrics (
    time TIMESTAMPTZ NOT NULL,
    model_id UUID NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC(20, 10) NOT NULL,
    metadata JSONB,
    PRIMARY KEY (time, model_id, metric_name)
);

-- Convert to hypertable (must be done before adding indexes)
SELECT create_hypertable('model_metrics', 'time', if_not_exists => TRUE);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_model_metrics_time_model ON model_metrics (time, model_id);
CREATE INDEX IF NOT EXISTS idx_model_metrics_time_name ON model_metrics (time, metric_name);
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_id ON model_metrics (model_id);

-- Create continuous aggregate for hourly model metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS model_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS hour,
    model_id,
    metric_name,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value,
    COUNT(*) as count
FROM model_metrics
GROUP BY hour, model_id, metric_name
WITH NO DATA;

-- Refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('model_metrics_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

-- Create prediction_logs table and convert to hypertable
CREATE TABLE IF NOT EXISTS prediction_logs (
    time TIMESTAMPTZ NOT NULL,
    prediction_id UUID NOT NULL,
    model_id UUID NOT NULL,
    user_id UUID,
    input_data JSONB NOT NULL,
    prediction JSONB NOT NULL,
    confidence_score FLOAT,
    response_time_ms FLOAT NOT NULL,
    error TEXT,
    PRIMARY KEY (time, prediction_id, model_id)
);

SELECT create_hypertable('prediction_logs', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_prediction_logs_time_model ON prediction_logs (time, model_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_time_user ON prediction_logs (time, user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_model_id ON prediction_logs (model_id);

-- Create dataset_metrics table and convert to hypertable
CREATE TABLE IF NOT EXISTS dataset_metrics (
    time TIMESTAMPTZ NOT NULL,
    dataset_id UUID NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC(20, 10) NOT NULL,
    metadata JSONB,
    PRIMARY KEY (time, dataset_id, metric_name)
);

SELECT create_hypertable('dataset_metrics', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_dataset_metrics_time_dataset ON dataset_metrics (time, dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_metrics_dataset_id ON dataset_metrics (dataset_id);

-- Create system_metrics table and convert to hypertable
CREATE TABLE IF NOT EXISTS system_metrics (
    time TIMESTAMPTZ NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC(20, 10) NOT NULL,
    metadata JSONB,
    PRIMARY KEY (time, service_name, metric_name)
);

SELECT create_hypertable('system_metrics', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_system_metrics_time_service ON system_metrics (time, service_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_service_name ON system_metrics (service_name);

-- Create training_metrics table and convert to hypertable
CREATE TABLE IF NOT EXISTS training_metrics (
    time TIMESTAMPTZ NOT NULL,
    model_id UUID NOT NULL,
    epoch NUMERIC NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC(20, 10) NOT NULL,
    metadata JSONB,
    PRIMARY KEY (time, model_id, epoch, metric_name)
);

SELECT create_hypertable('training_metrics', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_training_metrics_time_model ON training_metrics (time, model_id);
CREATE INDEX IF NOT EXISTS idx_training_metrics_model_id ON training_metrics (model_id);

-- Data retention policies (optional - keeps last 90 days)
SELECT add_retention_policy('model_metrics', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('prediction_logs', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('dataset_metrics', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('system_metrics', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('training_metrics', INTERVAL '90 days', if_not_exists => TRUE);

-- Compression policies (optional - compresses data older than 7 days)
ALTER TABLE model_metrics SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'model_id, metric_name',
    timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('model_metrics', INTERVAL '7 days', if_not_exists => TRUE);

ALTER TABLE prediction_logs SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'model_id',
    timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('prediction_logs', INTERVAL '7 days', if_not_exists => TRUE);

-- Print confirmation
DO $$ 
BEGIN
    RAISE NOTICE 'TimescaleDB initialization complete!';
    RAISE NOTICE 'Created hypertables: model_metrics, prediction_logs, dataset_metrics, system_metrics, training_metrics';
    RAISE NOTICE 'Created continuous aggregate: model_metrics_hourly';
    RAISE NOTICE 'Set retention policy: 90 days';
    RAISE NOTICE 'Set compression policy: 7 days';
END $$;
