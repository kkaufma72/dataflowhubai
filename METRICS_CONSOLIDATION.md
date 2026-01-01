# Metrics Consolidation: Timescale as Single Time-Series Store

## 🎯 Goal

**Replace InfluxDB with TimescaleDB** as the single time-series database for metrics, reducing operational complexity and storage costs.

---

## 📊 Current State

- ✅ Timescale extension enabled in Supabase Postgres
- ❌ InfluxDB still running (but mostly unused)
- ❌ Dual writes to Influx + Timescale in some places
- ❌ Grafana pointing to Influx for dashboards

---

## 🚀 Migration Plan

### Phase 1: Schema Setup (Immediate)

Create Timescale hypertables for all metrics:

```sql
-- Create metrics table
CREATE TABLE metrics (
    time TIMESTAMPTZ NOT NULL,
    model_id UUID,
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION,
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Convert to hypertable (6-hour chunks)
SELECT create_hypertable('metrics', 'time', chunk_time_interval => INTERVAL '6 hours');

-- Indexes for common queries
CREATE INDEX idx_metrics_model_id_time ON metrics (model_id, time DESC);
CREATE INDEX idx_metrics_name_time ON metrics (metric_name, time DESC);
CREATE INDEX idx_metrics_tags ON metrics USING GIN (tags);

-- Compression policy (compress chunks older than 7 days)
ALTER TABLE metrics SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'model_id, metric_name'
);

SELECT add_compression_policy('metrics', INTERVAL '7 days');

-- Retention policy (drop chunks older than 90 days)
SELECT add_retention_policy('metrics', INTERVAL '90 days');
```

### Phase 2: Data Migration (Optional)

If you have historical Influx data you need to preserve:

```python
# backend/scripts/migrate_influx_to_timescale.py
from influxdb_client import InfluxDBClient
import psycopg2

# 1. Query Influx
influx_client = InfluxDBClient(url="http://influxdb:8086", token="...")
query = 'from(bucket:"metrics") |> range(start: -30d)'
tables = influx_client.query_api().query(query)

# 2. Insert into Timescale
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

for table in tables:
    for record in table.records:
        cursor.execute("""
            INSERT INTO metrics (time, model_id, metric_name, metric_value, tags)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            record.get_time(),
            record.values.get("model_id"),
            record.get_measurement(),
            record.get_value(),
            json.dumps(record.values)
        ))

conn.commit()
```

### Phase 3: Update Writers

Replace all Influx writes with Timescale inserts:

**Before (Influx)**:
```python
from influxdb_client import InfluxDBClient, Point

point = Point("prediction") \
    .tag("model_id", model_id) \
    .field("accuracy", accuracy) \
    .time(datetime.utcnow())

influx_client.write_api().write(bucket="metrics", record=point)
```

**After (Timescale)**:
```python
from sqlalchemy import text

query = text("""
    INSERT INTO metrics (time, model_id, metric_name, metric_value, tags)
    VALUES (:time, :model_id, :metric_name, :metric_value, :tags)
""")

db.execute(query, {
    "time": datetime.utcnow(),
    "model_id": model_id,
    "metric_name": "prediction_accuracy",
    "metric_value": accuracy,
    "tags": json.dumps({"environment": "prod"})
})
```

### Phase 4: Update Readers

Replace Influx queries with Timescale SQL:

**Before (Flux)**:
```python
query = f'''
    from(bucket: "metrics")
    |> range(start: -24h)
    |> filter(fn: (r) => r["_measurement"] == "prediction")
    |> filter(fn: (r) => r["model_id"] == "{model_id}")
    |> aggregateWindow(every: 1h, fn: mean)
'''
result = influx_client.query_api().query(query)
```

**After (SQL)**:
```sql
SELECT
    time_bucket('1 hour', time) AS bucket,
    AVG(metric_value) AS avg_value
FROM metrics
WHERE
    model_id = :model_id
    AND metric_name = 'prediction_accuracy'
    AND time > NOW() - INTERVAL '24 hours'
GROUP BY bucket
ORDER BY bucket;
```

### Phase 5: Update Grafana

Grafana supports Postgres/Timescale natively:

1. Add Postgres data source in Grafana
2. Use SQL queries instead of Flux
3. Example dashboard query:

```sql
SELECT
    time_bucket('5 minutes', time) AS time,
    AVG(metric_value) AS value
FROM metrics
WHERE
    metric_name = 'cpu_usage'
    AND time > $__timeFrom()
    AND time < $__timeTo()
GROUP BY time_bucket('5 minutes', time)
ORDER BY time;
```

### Phase 6: Remove InfluxDB

Once all writes/reads are migrated:

```yaml
# docker-compose.yml
# Remove influxdb service
services:
  # influxdb:  # ❌ Remove this
  #   image: influxdb:2.7
  #   ...
```

```bash
# Stop and remove InfluxDB
docker-compose rm -sf influxdb

# Remove InfluxDB volumes (⚠️ data loss)
docker volume rm dataflowhubai_influxdb_data
```

---

## 🎯 Benefits

- **Fewer moving parts**: 1 database instead of 2
- **SQL queries**: No need to learn Flux
- **Better compression**: Timescale compresses >10x better than Influx
- **Cheaper**: Postgres storage cheaper than Influx
- **Joins**: Can join metrics with datasets/models tables directly
- **Backup**: Single backup process (Postgres only)

---

## 📈 Timescale Optimization Tips

```sql
-- 1. Tune chunk interval based on ingestion rate
-- High volume (millions/day): 1-3 hours
-- Medium volume (thousands/day): 6-12 hours
-- Low volume: 1 day

SELECT set_chunk_time_interval('metrics', INTERVAL '6 hours');

-- 2. Enable parallel query execution
ALTER TABLE metrics SET (parallel_workers = 4);

-- 3. Add continuous aggregates for common rollups
CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    model_id,
    metric_name,
    AVG(metric_value) AS avg_value,
    MAX(metric_value) AS max_value,
    MIN(metric_value) AS min_value
FROM metrics
GROUP BY bucket, model_id, metric_name;

-- Refresh policy (update every 15 minutes)
SELECT add_continuous_aggregate_policy('metrics_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '15 minutes'
);

-- 4. Use reorder policy (cluster data by query pattern)
SELECT add_reorder_policy('metrics', 'idx_metrics_model_id_time');
```

---

## 🧪 Testing Checklist

- [ ] Timescale hypertable created
- [ ] Compression policy applied (check `SHOW timescaledb.compress`)
- [ ] Retention policy set (90 days)
- [ ] Write metrics from backend (verify via `SELECT * FROM metrics LIMIT 10`)
- [ ] Query metrics with time_bucket aggregation
- [ ] Grafana dashboard connected to Postgres
- [ ] Grafana queries returning data
- [ ] InfluxDB removed from docker-compose
- [ ] No more references to `influxdb_client` in code

---

## 📚 Related Files

- `backend/core/timescale.py` — Timescale utilities (to be created)
- `backend/services/metrics_service.py` — Metrics ingestion service
- `supabase/migrations/20260101000001_create_metrics_hypertable.sql` — Schema migration
- `grafana/dashboards/timescale_metrics.json` — Updated Grafana dashboard

---

**Status**: Plan ready. Next: create hypertable migration + update metric writers.
