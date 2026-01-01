#!/bin/bash
# TimescaleDB Optimization - Quick Commands
# Usage: source this file or copy individual commands

# ==============================================
# HEALTH CHECKS
# ==============================================

# Check telemetry status (should be 'off')
alias ts-telemetry="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT setting FROM pg_settings WHERE name = 'timescaledb.telemetry_level';\""

# Check all background policies
alias ts-policies="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT hypertable_name, proc_name, scheduled, last_run_success FROM timescaledb_information.jobs WHERE application_name LIKE '%Policy%' ORDER BY hypertable_name;\""

# Check chunk intervals
alias ts-chunks="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT h.table_name, CASE WHEN d.interval_length >= 86400000000 THEN (d.interval_length / 86400000000)::text || ' days' WHEN d.interval_length >= 3600000000 THEN (d.interval_length / 3600000000)::text || ' hours' END AS interval FROM _timescaledb_catalog.hypertable h JOIN _timescaledb_catalog.dimension d ON d.hypertable_id = h.id WHERE d.column_name = 'time';\""

# Check parallel worker settings
alias ts-parallel="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT name, setting FROM pg_settings WHERE name IN ('max_parallel_workers_per_gather', 'max_parallel_workers');\""

# ==============================================
# COMPRESSION MONITORING
# ==============================================

# Check compression status
alias ts-compression-status="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT hypertable_name, (SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name = h.table_name AND compression_status = 'Compressed') as compressed, (SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name = h.table_name) as total FROM _timescaledb_catalog.hypertable h;\""

# Force compression on old chunks (unified_metrics, older than 3 days)
alias ts-compress-metrics="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT compress_chunk(i) FROM show_chunks('unified_metrics', older_than => INTERVAL '3 days') i;\""

# Force compression on predictions (older than 1 day)
alias ts-compress-predictions="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT compress_chunk(i) FROM show_chunks('prediction_logs', older_than => INTERVAL '1 day') i;\""

# ==============================================
# PERFORMANCE MONITORING
# ==============================================

# Check table sizes
alias ts-sizes="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT schemaname || '.' || tablename as table, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE tablename IN ('unified_metrics', 'prediction_logs', 'model_metrics') ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;\""

# Check index usage
alias ts-indexes="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT schemaname || '.' || tablename as table, COUNT(*) as num_indexes, COUNT(*) FILTER (WHERE indexdef LIKE '%USING gin%') as gin_indexes FROM pg_indexes WHERE tablename IN ('unified_metrics', 'prediction_logs', 'model_metrics') GROUP BY schemaname, tablename;\""

# Show query plan for common pattern (check for parallel workers)
ts-explain-query() {
    docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c "
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT entity_type, AVG(metric_value)
    FROM unified_metrics
    WHERE time > NOW() - INTERVAL '7 days'
    GROUP BY entity_type;
    "
}

# ==============================================
# DATA VERIFICATION
# ==============================================

# Check oldest/newest data
alias ts-data-range="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT 'unified_metrics' as table, MIN(time) as oldest, MAX(time) as newest FROM unified_metrics UNION ALL SELECT 'prediction_logs', MIN(time), MAX(time) FROM prediction_logs;\""

# Count metrics by entity type
alias ts-metric-counts="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT entity_type, COUNT(*) FROM unified_metrics GROUP BY entity_type;\""

# Show recent metrics
alias ts-recent-metrics="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"SELECT entity_type, entity_id, metric_name, metric_value, time FROM unified_metrics ORDER BY time DESC LIMIT 10;\""

# ==============================================
# MAINTENANCE
# ==============================================

# Manually refresh continuous aggregates
alias ts-refresh-hourly="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"CALL refresh_continuous_aggregate('model_metrics_hourly', NOW() - INTERVAL '24 hours', NOW());\""
alias ts-refresh-daily="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"CALL refresh_continuous_aggregate('dataset_metrics_daily', NOW() - INTERVAL '7 days', NOW());\""

# Analyze tables (update statistics)
alias ts-analyze="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"ANALYZE unified_metrics; ANALYZE prediction_logs; ANALYZE model_metrics;\""

# Vacuum tables
alias ts-vacuum="docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c \"VACUUM ANALYZE unified_metrics; VACUUM ANALYZE prediction_logs;\""

# ==============================================
# FULL OPTIMIZATION SUITE
# ==============================================

# Run all health checks
ts-health() {
    echo "=== TimescaleDB Health Check ==="
    echo ""
    echo "1. Telemetry Status:"
    ts-telemetry
    echo ""
    echo "2. Background Policies:"
    ts-policies
    echo ""
    echo "3. Chunk Intervals:"
    ts-chunks
    echo ""
    echo "4. Parallel Workers:"
    ts-parallel
    echo ""
    echo "5. Table Sizes:"
    ts-sizes
    echo ""
    echo "6. Compression Status:"
    ts-compression-status
    echo ""
    echo "7. Data Range:"
    ts-data-range
}

# Re-run optimization (idempotent)
ts-optimize() {
    echo "Re-running TimescaleDB optimization..."
    docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -f /backend/sql/timescale-optimize.sql
    echo "Optimization complete!"
}

# ==============================================
# USAGE EXAMPLES
# ==============================================

# After sourcing this file:
#   ts-health              # Run full health check
#   ts-policies            # Check background jobs
#   ts-compression-status  # Check compression progress
#   ts-sizes               # Check table sizes
#   ts-optimize            # Re-run optimization

echo "✓ TimescaleDB optimization commands loaded"
echo ""
echo "Quick commands:"
echo "  ts-health               - Full health check"
echo "  ts-policies             - List background jobs"
echo "  ts-compression-status   - Check compression"
echo "  ts-sizes                - Table sizes"
echo "  ts-data-range           - Data age ranges"
echo ""
echo "Maintenance:"
echo "  ts-compress-metrics     - Force compress metrics"
echo "  ts-analyze              - Update statistics"
echo "  ts-vacuum               - Vacuum tables"
echo ""
echo "Advanced:"
echo "  ts-explain-query        - Show query plan"
echo "  ts-refresh-hourly       - Refresh hourly aggregate"
echo "  ts-optimize             - Re-run optimization"
