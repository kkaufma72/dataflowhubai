-- Consolidate metrics into TimescaleDB hypertable
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS metrics (
  ts timestamptz NOT NULL,
  source text NOT NULL,           -- e.g., api, trainer, inference
  entity_id uuid NOT NULL,        -- model/deployment identifier
  name text NOT NULL,             -- metric name
  value double precision NOT NULL,
  tags jsonb DEFAULT '{}'::jsonb
);

SELECT create_hypertable('metrics', 'ts', chunk_time_interval => interval '6 hours', if_not_exists => true);
CREATE INDEX IF NOT EXISTS metrics_entity_name_ts_idx ON metrics (entity_id, name, ts DESC);

ALTER TABLE metrics SET (
  timescaledb.compress = true,
  timescaledb.compress_orderby = 'ts DESC',
  timescaledb.compress_segmentby = 'entity_id, name'
);

SELECT add_compression_policy('metrics', interval '7 days', if_not_exists => true);
SELECT add_retention_policy('metrics', interval '90 days', if_not_exists => true);
SELECT add_reorder_policy('metrics', 'metrics_entity_name_ts_idx', if_not_exists => true);
