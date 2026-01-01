# Metrics Consolidation - Quick Reference

## Schema at a Glance

```
unified_metrics(time, entity_type, entity_id, metric_name, metric_value, tags)
└── Hypertable with 7-day chunks
└── Compression after 7 days (10x reduction)
└── Retention: 90 days
└── Continuous aggregates: model_metrics_hourly

prediction_logs(time, prediction_id, model_id, user_id, input_data, prediction, ...)
└── Hypertable with 1-day chunks
└── Compression after 3 days
└── Retention: 30 days
```

## Write Patterns

```python
# Model metrics
await service.record_model_metric(model_id, 'accuracy', 0.95, {'version': 'v2'})

# Dataset metrics
await service.record_dataset_metric(dataset_id, 'quality_score', 0.87)

# Training metrics (epoch in tags)
await service.record_training_metric(model_id, epoch=10, metric_name='loss', metric_value=0.05)

# System metrics
await service.record_system_metric('api', 'response_time_ms', 45.2)

# Predictions
await service.log_prediction(model_id, user_id, input_data, prediction, 0.89, 23.4)
```

## Query Patterns

```python
# Recent metrics
metrics = await service.get_model_metrics(model_id, 'accuracy', start_time=...)

# Aggregated (uses continuous aggregate)
agg = await service.get_model_metrics_aggregated(model_id, 'accuracy', start, end)

# Prediction stats
stats = await service.get_prediction_stats(model_id, start, end)
```

## SQL Queries

```sql
-- Raw metrics (all entity types)
SELECT * FROM unified_metrics WHERE entity_type = 'model' AND entity_id = '...';

-- By tags
SELECT * FROM unified_metrics WHERE tags->>'environment' = 'production';

-- Hourly rollup (auto-uses continuous aggregate)
SELECT * FROM model_metrics_hourly WHERE model_id = '...' AND bucket > NOW() - INTERVAL '7 days';

-- Predictions for a model
SELECT * FROM prediction_logs WHERE model_id = '...' AND time > NOW() - INTERVAL '24 hours';
```

## Maintenance Commands

```bash
# Check compression ratio
docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c "
SELECT hypertable_name, 
       pg_size_pretty(before_compression_total_bytes) as before,
       pg_size_pretty(after_compression_total_bytes) as after
FROM timescaledb_information.compression_settings;"

# Force compression (if needed)
docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c "
SELECT compress_chunk(i) FROM show_chunks('unified_metrics') i;"

# Check oldest records (should match retention policy)
docker-compose exec timescaledb psql -U tsdata_user -d timeseries_db -c "
SELECT entity_type, MIN(time) as oldest, MAX(time) as newest
FROM unified_metrics GROUP BY entity_type;"
```

## Entity Types

| entity_type | Used For | entity_id |
|-------------|----------|-----------|
| `model` | Model performance metrics | model_id (UUID) |
| `dataset` | Dataset quality metrics | dataset_id (UUID) |
| `training` | Training progress | model_id (UUID) |
| `system` | Infrastructure metrics | hash of service_name |

## Common Tags

```json
{
  "environment": "production|staging|development",
  "version": "v1.2.3",
  "user_id": "uuid",
  "experiment_id": "exp-001",
  "epoch": 10,
  "batch_size": 32,
  "service_name": "api|worker|celery"
}
```

## Policies in Effect

- **Compression**: unified_metrics after 7 days, prediction_logs after 3 days
- **Retention**: unified_metrics 90 days, prediction_logs 30 days  
- **Continuous Aggregates**: Hourly model metrics, daily dataset metrics
- **Auto-refresh**: Hourly for model metrics, daily for dataset metrics

## Backward Compatibility

Old table names still work via views:

```sql
SELECT * FROM model_metrics WHERE model_id = '...';       -- → unified_metrics
SELECT * FROM dataset_metrics WHERE dataset_id = '...';   -- → unified_metrics
SELECT * FROM system_metrics WHERE service_name = '...';  -- → unified_metrics
SELECT * FROM training_metrics WHERE model_id = '...';    -- → unified_metrics
```

## Files

- **SQL Schema**: `backend/sql/timescale-unified-metrics.sql`
- **Service**: `backend/services/timescale_service.py`
- **Docs**: `METRICS_CONSOLIDATION.md` (full), `METRICS_QUICK_REF.md` (this file)
- **Data Layer**: `DATA_LAYER_SIMPLIFICATION.md`

## Metrics Flow

```
Frontend/Tasks → TimescaleService.record_*_metric() 
                → INSERT INTO unified_metrics
                → Auto-compress after 7 days (10x smaller)
                → Auto-delete after 90 days
                → Continuous aggregates update hourly
```

---

**TL;DR**: One table (`unified_metrics`) for all metric types, automatic compression & cleanup, fast pre-aggregated queries.
