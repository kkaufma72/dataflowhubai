# TimescaleDB Integration Guide

## Overview
TimescaleDB is now integrated for storing time-series metrics across your ML platform. This enables efficient querying of model performance, predictions, training metrics, and system health over time.

## Architecture

### Tables (Hypertables)
1. **model_metrics** - Model performance metrics (accuracy, precision, drift, etc.)
2. **prediction_logs** - Individual prediction logs with input/output/latency
3. **dataset_metrics** - Data quality metrics over time
4. **system_metrics** - API and infrastructure performance
5. **training_metrics** - Training progress (loss, validation per epoch)

### Features
- **Automatic Retention**: Data older than 90 days is automatically deleted
- **Compression**: Data older than 7 days is compressed to save space
- **Continuous Aggregates**: Hourly rollups for fast dashboard queries
- **Time-bucket Queries**: Efficient aggregation by hour/day/week

## Setup

### 1. Initialize Database (First Time Only)

```bash
# From backend directory
cd backend

# Run initialization script
python scripts/setup_timescaledb.py
```

This script will:
- Connect to TimescaleDB container (localhost:5433)
- Create all hypertables
- Set up continuous aggregates
- Configure retention and compression policies

### 2. Verify Installation

Check Docker container is running:
```bash
docker ps | grep timescaledb
```

Connect to TimescaleDB:
```bash
docker exec -it dataflow_timescaledb psql -U tsdata_user -d timeseries_db
```

List hypertables:
```sql
SELECT * FROM timescaledb_information.hypertables;
```

## API Endpoints

### Record Model Metrics
```bash
POST /api/monitoring/metrics/{model_id}
Content-Type: application/json

{
  "accuracy": 0.95,
  "precision": 0.92,
  "recall": 0.94,
  "f1_score": 0.93
}
```

### Get Model Metrics (Raw)
```bash
GET /api/monitoring/metrics/{model_id}?start_time=2024-01-01T00:00:00Z&end_time=2024-01-02T00:00:00Z&metric_name=accuracy
```

### Get Aggregated Metrics (Dashboard)
```bash
GET /api/monitoring/metrics/{model_id}/aggregated?interval=1 hour&start_time=2024-01-01T00:00:00Z
```

Returns hourly averages:
```json
[
  {
    "time_bucket": "2024-01-01T00:00:00Z",
    "metric_name": "accuracy",
    "avg_value": 0.95,
    "min_value": 0.92,
    "max_value": 0.97,
    "count": 120
  }
]
```

### Log Predictions
```bash
POST /api/monitoring/predictions/{model_id}/log
Content-Type: application/json

{
  "input_data": {"feature1": 1.2, "feature2": 3.4},
  "prediction": {"class": "A", "probability": 0.87},
  "confidence_score": 0.87,
  "response_time_ms": 45.2
}
```

### Get Prediction Statistics
```bash
GET /api/monitoring/predictions/{model_id}/stats?start_time=2024-01-01T00:00:00Z
```

Returns:
```json
{
  "total_predictions": 10000,
  "avg_response_time_ms": 42.5,
  "min_response_time_ms": 15.2,
  "max_response_time_ms": 250.0,
  "error_count": 5,
  "error_rate": 0.0005
}
```

### Record Training Metrics
```bash
POST /api/monitoring/training/{model_id}/metrics
Content-Type: application/json

{
  "epoch": 5,
  "metrics": {
    "loss": 0.25,
    "val_loss": 0.32,
    "accuracy": 0.92,
    "val_accuracy": 0.89
  }
}
```

### Get Training History
```bash
GET /api/monitoring/training/{model_id}/history?metric_name=loss
```

## Usage Examples

### Python Service Layer

```python
from services.timescale_service import TimescaleService
from uuid import UUID

# In your route handler
async def train_model(model_id: UUID, db: AsyncSession):
    service = TimescaleService(db)
    
    # During training, record metrics per epoch
    for epoch in range(10):
        loss = train_epoch()
        val_loss = validate()
        
        await service.record_training_metric(
            model_id=model_id,
            epoch=epoch,
            metric_name="loss",
            metric_value=loss
        )
        
        await service.record_training_metric(
            model_id=model_id,
            epoch=epoch,
            metric_name="val_loss",
            metric_value=val_loss
        )
    
    # After training, record final metrics
    await service.record_model_metric(
        model_id=model_id,
        metric_name="final_accuracy",
        metric_value=0.95
    )
```

### Frontend Dashboard Integration

```typescript
// Fetch hourly metrics for last 7 days
const response = await fetch(
  `/api/monitoring/metrics/${modelId}/aggregated?interval=1 hour&start_time=${startTime}`
);
const metrics = await response.json();

// Render with Chart.js
const chartData = {
  labels: metrics.map(m => new Date(m.time_bucket)),
  datasets: [{
    label: 'Model Accuracy',
    data: metrics.map(m => m.avg_value),
    borderColor: 'rgb(79, 70, 229)',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  }]
};
```

## Query Patterns

### Time-Range Queries
```python
# Get metrics for last 24 hours
metrics = await service.get_model_metrics(
    model_id=model_id,
    start_time=datetime.utcnow() - timedelta(hours=24),
    end_time=datetime.utcnow()
)
```

### Aggregated Queries
```python
# Get hourly averages for last 7 days
aggregated = await service.get_model_metrics_aggregated(
    model_id=model_id,
    interval="1 hour",
    start_time=datetime.utcnow() - timedelta(days=7),
    end_time=datetime.utcnow()
)
```

### Prediction Analytics
```python
# Get prediction stats for model
stats = await service.get_prediction_stats(
    model_id=model_id,
    start_time=datetime.utcnow() - timedelta(hours=24)
)

print(f"Total predictions: {stats['total_predictions']}")
print(f"Avg response time: {stats['avg_response_time']}ms")
print(f"Error rate: {stats['error_rate']*100}%")
```

## Performance Optimization

### Using Continuous Aggregates
For dashboards, query the pre-aggregated `model_metrics_hourly` view instead of raw data:

```sql
SELECT * FROM model_metrics_hourly
WHERE model_id = 'uuid'
  AND hour >= NOW() - INTERVAL '7 days'
ORDER BY hour;
```

### Compression Status
Check compression status:
```sql
SELECT * FROM timescaledb_information.chunks
WHERE hypertable_name = 'model_metrics'
ORDER BY range_end DESC;
```

### Manual Refresh
Force refresh of continuous aggregate:
```sql
CALL refresh_continuous_aggregate('model_metrics_hourly', NOW() - INTERVAL '1 day', NOW());
```

## Monitoring & Maintenance

### Check Hypertable Stats
```sql
SELECT hypertable_name, 
       num_chunks, 
       total_size,
       compression_status
FROM timescaledb_information.hypertables;
```

### View Retention Policies
```sql
SELECT * FROM timescaledb_information.jobs
WHERE proc_name = 'policy_retention';
```

### View Compression Policies
```sql
SELECT * FROM timescaledb_information.jobs
WHERE proc_name = 'policy_compression';
```

## Troubleshooting

### Connection Issues
```bash
# Check TimescaleDB is running
docker ps | grep timescaledb

# View logs
docker logs dataflow_timescaledb

# Test connection
docker exec -it dataflow_timescaledb psql -U tsdata_user -d timeseries_db -c "SELECT version();"
```

### Initialization Failed
If setup script fails, manually create database:
```bash
docker exec -it dataflow_timescaledb psql -U tsdata_user -c "CREATE DATABASE timeseries_db;"
python backend/scripts/setup_timescaledb.py
```

### Query Performance Issues
- Use `EXPLAIN ANALYZE` to check query plans
- Ensure indexes exist on frequently queried columns
- Use continuous aggregates for dashboard queries
- Consider shorter retention periods if storage is limited

## Best Practices

1. **Record Metrics Asynchronously**: Use background tasks to avoid blocking API responses
2. **Batch Inserts**: For high-volume metrics, batch multiple inserts
3. **Use Aggregates for Dashboards**: Query continuous aggregates instead of raw data
4. **Set Appropriate Retention**: 90 days is default, adjust based on needs
5. **Monitor Compression**: Compression saves ~90% storage for older data
6. **Index Wisely**: Indexes on (time, model_id) are sufficient for most queries

## Integration Checklist

- [x] TimescaleDB models created (`timescale_models.py`)
- [x] Service layer implemented (`timescale_service.py`)
- [x] API endpoints added (`monitoring_routes.py`)
- [x] Initialization script created (`setup_timescaledb.py`)
- [ ] Frontend dashboard integration
- [ ] Background task for metrics recording
- [ ] Alert triggers based on metrics
- [ ] Grafana dashboard setup (optional)

## Next Steps

1. Run `python backend/scripts/setup_timescaledb.py` to initialize
2. Test endpoints with curl or Postman
3. Integrate metrics recording in training/deployment flows
4. Build frontend dashboards with aggregated data
5. Set up alerts for anomalous metrics

---

**Need Help?** Check the [TimescaleDB Documentation](https://docs.timescale.com/) or the service layer code in `backend/services/timescale_service.py`.
