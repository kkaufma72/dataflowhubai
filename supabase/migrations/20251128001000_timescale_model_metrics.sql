-- Hypertable backing the FastAPI monitoring endpoints
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS model_metrics (
  time timestamptz NOT NULL,
  model_id uuid NOT NULL,
  metric_name text NOT NULL,
  metric_value double precision NOT NULL,
  meta_data jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (time, model_id, metric_name)
);

SELECT create_hypertable('model_metrics', 'time', chunk_time_interval => interval '6 hours', if_not_exists => true);
CREATE INDEX IF NOT EXISTS model_metrics_model_time_idx ON model_metrics (model_id, time DESC);
CREATE INDEX IF NOT EXISTS model_metrics_name_time_idx ON model_metrics (metric_name, time DESC);

ALTER TABLE model_metrics SET (
  timescaledb.compress = true,
  timescaledb.compress_orderby = 'time DESC',
  timescaledb.compress_segmentby = 'model_id, metric_name'
);

SELECT add_compression_policy('model_metrics', interval '7 days', if_not_exists => true);
SELECT add_retention_policy('model_metrics', interval '90 days', if_not_exists => true);
SELECT add_reorder_policy('model_metrics', 'model_metrics_model_time_idx', if_not_exists => true);
