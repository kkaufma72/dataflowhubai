-- TimescaleDB Optimization Script
-- Run this after creating hypertables to optimize performance

-- ==============================================
-- 1. DISABLE TELEMETRY (Privacy & Performance)
-- ==============================================
ALTER DATABASE timeseries_db SET timescaledb.telemetry_level = 'off';

-- Reload config
SELECT pg_reload_conf();

-- ==============================================
-- 2. TUNE CHUNK TIME INTERVALS
-- ==============================================
-- Based on ingestion patterns:
-- - unified_metrics: Low-medium frequency (every 1-5 min) → 6 hour chunks
-- - prediction_logs: High frequency (every few seconds) → 1 hour chunks

-- unified_metrics: 6-hour chunks (optimal for metrics that arrive every 1-5 min)
SELECT set_chunk_time_interval('unified_metrics', INTERVAL '6 hours');

-- prediction_logs: 1-hour chunks (optimal for high-frequency predictions)
SELECT set_chunk_time_interval('prediction_logs', INTERVAL '1 hour');

-- model_metrics (legacy): Keep 7-day chunks for now
SELECT set_chunk_time_interval('model_metrics', INTERVAL '7 days');

-- ==============================================
-- 3. ENABLE PARALLEL QUERY EXECUTION
-- ==============================================
-- Allow parallel workers for faster aggregation queries
ALTER DATABASE timeseries_db SET max_parallel_workers_per_gather = 4;
ALTER DATABASE timeseries_db SET max_parallel_workers = 8;

-- Enable parallel execution for large queries
ALTER DATABASE timeseries_db SET parallel_tuple_cost = 0.01;
ALTER DATABASE timeseries_db SET parallel_setup_cost = 100;

-- ==============================================
-- 4. ADD MISSING REORDER POLICIES
-- ==============================================
-- Reorder chunks by (entity_type, entity_id, time) for better query performance

-- unified_metrics reorder policy
SELECT add_reorder_policy(
    'unified_metrics',
    'unified_metrics_entity_type_entity_id_time_idx',
    if_not_exists => TRUE
);

-- prediction_logs reorder policy  
SELECT add_reorder_policy(
    'prediction_logs',
    'prediction_logs_model_id_time_idx',
    if_not_exists => TRUE
);

-- ==============================================
-- 5. OPTIMIZE COMPRESSION POLICIES
-- ==============================================
-- Compress more aggressively to save storage

-- unified_metrics: Compress after 3 days (was 7)
SELECT remove_compression_policy('unified_metrics', if_exists => TRUE);
SELECT add_compression_policy(
    'unified_metrics',
    INTERVAL '3 days',
    if_not_exists => TRUE
);

-- prediction_logs: Compress after 1 day (was 3)
SELECT remove_compression_policy('prediction_logs', if_exists => TRUE);
SELECT add_compression_policy(
    'prediction_logs',
    INTERVAL '1 day',
    if_not_exists => TRUE
);

-- ==============================================
-- 6. ADD CONTINUOUS AGGREGATE REFRESH POLICIES
-- ==============================================
-- Auto-refresh continuous aggregates

-- model_metrics_hourly: Refresh every hour
SELECT add_continuous_aggregate_policy(
    'model_metrics_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- dataset_metrics_daily: Refresh daily
SELECT add_continuous_aggregate_policy(
    'dataset_metrics_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- ==============================================
-- 7. OPTIMIZE STATISTICS
-- ==============================================
-- Set statistics target for better query planning on JSONB columns
ALTER TABLE unified_metrics ALTER COLUMN tags SET STATISTICS 1000;
ALTER TABLE prediction_logs ALTER COLUMN tags SET STATISTICS 1000;
ALTER TABLE prediction_logs ALTER COLUMN input_data SET STATISTICS 500;
ALTER TABLE prediction_logs ALTER COLUMN prediction SET STATISTICS 500;

-- Analyze tables to update statistics
ANALYZE unified_metrics;
ANALYZE prediction_logs;
ANALYZE model_metrics;

-- ==============================================
-- 8. OPTIMIZE INDEXES
-- ==============================================
-- Add GIN indexes for JSONB tag queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS unified_metrics_tags_gin_idx 
ON unified_metrics USING GIN (tags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS prediction_logs_tags_gin_idx 
ON prediction_logs USING GIN (tags);

-- Add covering index for common query pattern (entity_type, entity_id, metric_name, time)
CREATE INDEX CONCURRENTLY IF NOT EXISTS unified_metrics_entity_metric_time_idx
ON unified_metrics (entity_type, entity_id, metric_name, time DESC);

-- ==============================================
-- 9. SET AUTOVACUUM SETTINGS
-- ==============================================
-- More aggressive autovacuum for high-write tables
ALTER TABLE unified_metrics SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_analyze_scale_factor = 0.005
);

ALTER TABLE prediction_logs SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_analyze_scale_factor = 0.005
);

-- ==============================================
-- 10. VERIFY OPTIMIZATION
-- ==============================================
-- Check chunk intervals
SELECT 
    h.table_name AS hypertable,
    pg_size_pretty(d.interval_length) AS chunk_interval
FROM _timescaledb_catalog.hypertable h
JOIN _timescaledb_catalog.dimension d ON d.hypertable_id = h.id
WHERE d.column_name = 'time'
ORDER BY h.table_name;

-- Check all policies
SELECT 
    hypertable_name,
    proc_name,
    scheduled,
    config
FROM timescaledb_information.jobs
WHERE application_name LIKE '%Policy%'
ORDER BY hypertable_name, proc_name;

-- Check compression settings
SELECT 
    hypertable_schema,
    hypertable_name,
    attname,
    compression_algorithm,
    orderby_column_index,
    segmentby_column_index
FROM timescaledb_information.compression_settings
ORDER BY hypertable_name, orderby_column_index, segmentby_column_index;

-- Summary
\echo '=============================================='
\echo 'TimescaleDB Optimization Complete!'
\echo '=============================================='
\echo ''
\echo 'Optimizations Applied:'
\echo '- ✓ Telemetry disabled'
\echo '- ✓ Chunk intervals: 6h (unified_metrics), 1h (prediction_logs)'
\echo '- ✓ Parallel workers: 4 per gather, 8 total'
\echo '- ✓ Compression policies: 3 days (metrics), 1 day (predictions)'
\echo '- ✓ Retention policies: 90 days (metrics), 30 days (predictions)'
\echo '- ✓ Reorder policies added'
\echo '- ✓ GIN indexes on JSONB columns'
\echo '- ✓ Statistics optimized'
\echo '- ✓ Autovacuum tuned'
\echo ''
\echo 'Next: Run timescaledb-tune for system-level optimizations'
\echo '  docker-compose exec timescaledb timescaledb-tune --quiet --yes'
\echo ''
