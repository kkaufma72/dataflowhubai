# 🚀 Production Deployment Guide — Metrics Batching System

## Overview

Safe deployment strategy for the new metrics batching infrastructure to production.

---

## 🎯 What Changed

### New Components
1. **MetricsBatcher** (`backend/lib/metrics_batcher.py`) — in-memory buffering service
2. **Metrics API** (`backend/routers/metrics_routes.py`) — batch ingestion endpoints
3. **Metrics Helper** (`backend/lib/metrics_helper.py`) — HTTP client for apps
4. **Grafana Integration** — TimescaleDB datasource (InfluxDB removed)

### Configuration Updates
- `backend/utils/config.py` — TimescaleDB defaults updated
- `grafana-provisioning/datasources/timescale.yml` — credentials fixed
- `grafana-provisioning/dashboards/json/model-metrics.json` — queries updated

---

## 📋 Pre-Deployment Checklist

### 1. Database Migration (TimescaleDB)

**Action Required:** Run the initialization script on production TimescaleDB

```bash
# If using Docker (recommended)
docker exec -i your-timescaledb-container psql -U postgres -d timescale < scripts/migrate-to-timescale.sql

# If psql is installed locally
psql -U postgres -h your-timescale-host -d timescale -f scripts/migrate-to-timescale.sql

# If using managed TimescaleDB (Timescale Cloud, AWS RDS)
cat scripts/migrate-to-timescale.sql | psql "postgresql://user:pass@host:port/timescale?sslmode=require"
```

**What it does:**
- Creates `metrics` table with hypertable
- Sets up indexes for performance
- Configures 90-day retention policy
- Creates compression policy

**Verify:**
```bash
# Check hypertables created
docker exec your-timescaledb-container psql -U postgres -d timescale -c "
  SELECT hypertable_name, num_chunks, compression_enabled 
  FROM timescaledb_information.hypertables;"

# Check retention policies
docker exec your-timescaledb-container psql -U postgres -d timescale -c "
  SELECT application_name, config 
  FROM timescaledb_information.jobs 
  WHERE proc_name LIKE '%retention%';"

# Verify metrics table
docker exec your-timescaledb-container psql -U postgres -d timescale -c "\d metrics"
```

### 2. Environment Variables

**Add to production `.env` or container config:**

```bash
# TimescaleDB (required)
TIMESCALEDB_HOST=your-timescale-host
TIMESCALEDB_PORT=5432
TIMESCALEDB_USER=postgres
TIMESCALEDB_PASSWORD=your-secure-password
TIMESCALEDB_DB=timescale

# Metrics Batching (optional tuning)
METRICS_BATCH_SIZE=1000              # Metrics per batch
METRICS_FLUSH_INTERVAL=5.0           # Seconds between flushes
METRICS_MAX_BUFFER_SIZE=10000        # Max buffer before backpressure
```

### 3. Dependencies

**Verify psycopg2 is installed:**

```bash
# In backend/requirements.txt (should already be there)
psycopg2-binary>=2.9.0
```

---

## 🔄 Deployment Strategy

### Option A: Blue-Green Deployment (Recommended)

**Safest approach — zero downtime, easy rollback**

#### Step 1: Deploy to staging/canary environment
```bash
# Build and deploy to staging
docker-compose -f docker-compose.prod.yml up -d backend

# Verify health
curl https://staging.yourapp.com/api/health | jq '.services.metrics_batcher'
```

#### Step 2: Run smoke tests
```bash
# Test batch endpoint
curl -X POST https://staging.yourapp.com/api/metrics/batch \
  -H "Content-Type: application/json" \
  -d '{"metrics":[{"metric_name":"test_metric","value":1.0}]}'

# Verify flush
sleep 6
curl https://staging.yourapp.com/api/metrics/stats | jq

# Check TimescaleDB
psql -U postgres -d timescale -c "SELECT COUNT(*) FROM metrics WHERE metric_name = 'test_metric';"
```

#### Step 3: Monitor for 1-2 hours
- Check `/api/metrics/stats` — verify `dropped_count` stays at 0
- Monitor TimescaleDB CPU/IOPS — should be significantly lower
- Check logs for errors: `docker logs backend | grep -i "metric\|error"`

#### Step 4: Promote to production
```bash
# Swap traffic to new backend
# (Method depends on your load balancer)
```

#### Step 5: Keep old version running for 24h (quick rollback)

---

### Option B: Rolling Deployment

**Gradual rollout with partial traffic**

#### Step 1: Deploy to 10% of backend instances
```bash
# Update 1 out of 10 backend replicas
kubectl set image deployment/backend backend=yourimage:new-version --record
kubectl rollout pause deployment/backend
```

#### Step 2: Monitor metrics batcher stats
```bash
# Check every 5 minutes
watch -n 300 'curl -s https://api.yourapp.com/api/metrics/stats | jq'
```

#### Step 3: Gradually increase traffic
```bash
# 10% → 25% → 50% → 100% over 4 hours
kubectl rollout resume deployment/backend
```

---

### Option C: Simple Restart (Small Apps)

**For low-traffic apps or maintenance windows**

```bash
# 1. Announce maintenance window (optional)
# 2. Deploy new backend
docker-compose -f docker-compose.prod.yml up -d --force-recreate backend

# 3. Verify health
curl https://api.yourapp.com/api/health

# 4. Monitor for 30 minutes
docker logs -f backend | grep -i "metric"
```

---

## 🔍 Post-Deployment Validation

### 1. Health Check
```bash
curl https://api.yourapp.com/api/health | jq '.services.metrics_batcher'

# Expected:
# {
#   "status": "healthy",
#   "message": "Buffered: 0, Flushed: 1234"
# }
```

### 2. Metrics Flow Test
```bash
# Send test metrics
curl -X POST https://api.yourapp.com/api/metrics/batch \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": [
      {"metric_name":"prod_test","value":1.0,"tags":{"env":"prod"}}
    ]
  }'

# Wait for flush (5 seconds)
sleep 6

# Verify in TimescaleDB
psql -U postgres -d timescale -c "SELECT * FROM metrics WHERE metric_name = 'prod_test' ORDER BY time DESC LIMIT 1;"
```

### 3. Performance Validation
```bash
# Before (if you tracked it)
# - TimescaleDB write IOPS: ~500/sec
# - Insert latency: ~50ms

# After (should be)
# - TimescaleDB write IOPS: ~5/sec (100x reduction)
# - Insert latency: <5ms (buffering)

# Check TimescaleDB metrics
psql -U postgres -d timescale -c "
  SELECT 
    schemaname,
    relname,
    n_tup_ins AS inserts,
    n_tup_upd AS updates
  FROM pg_stat_user_tables 
  WHERE relname = 'metrics';
"
```

### 4. Grafana Dashboard Test
1. Open https://grafana.yourapp.com
2. Go to "Model Metrics (TimescaleDB)" dashboard
3. Verify charts populate with real data
4. Check query times (should be <500ms)

---

## 📊 Monitoring

### Key Metrics to Watch

#### 1. Batcher Stats (`/api/metrics/stats`)
```json
{
  "running": true,           // Must be true
  "total_received": 50000,   // Monotonically increasing
  "total_flushed": 50000,    // Should match received (±batch size)
  "dropped_count": 0,        // Must stay at 0
  "total_buffered": 234      // Should stay under batch_size
}
```

**Alert if:**
- `dropped_count > 0` → Buffer overflow, increase `METRICS_MAX_BUFFER_SIZE`
- `total_buffered > 5000` → Flush falling behind, check TimescaleDB connection
- `running = false` → Batcher crashed, check logs

#### 2. TimescaleDB Performance
```sql
-- Query rate
SELECT 
  NOW() - query_start AS duration,
  query 
FROM pg_stat_activity 
WHERE datname = 'timescale' AND state = 'active';

-- Table size
SELECT pg_size_pretty(pg_total_relation_size('metrics'));

-- Compression ratio
SELECT * FROM timescaledb_information.compressed_chunk_stats 
WHERE hypertable_name = 'metrics';
```

**Alert if:**
- Active queries > 100 → Connection pool exhausted
- Table size growing >10GB/day → Retention policy not working
- Compression ratio < 5x → Compression not enabled

#### 3. Backend Health
```bash
# CPU usage (should decrease after batching)
docker stats backend --no-stream

# Error rate
docker logs backend --since 1h | grep -i "error" | wc -l
```

---

## 🚨 Rollback Plan

### If Issues Detected (within 24 hours)

#### Option 1: Revert to Previous Container
```bash
# Tag latest working version as "stable" before deploying
docker tag backend:current backend:stable

# Rollback
docker-compose -f docker-compose.prod.yml down backend
docker-compose -f docker-compose.prod.yml up -d backend:stable
```

#### Option 2: Disable Metrics Batcher (keep backend running)
```bash
# Set environment variable to bypass batcher
export METRICS_BATCHER_ENABLED=false

# Restart backend
docker-compose restart backend

# Metrics will fall back to direct writes (slower but functional)
```

#### Option 3: Database-Only Rollback
```sql
-- If metrics table has issues, revert schema
DROP TABLE IF EXISTS metrics CASCADE;

-- Re-run old InfluxDB setup (if you kept backups)
```

---

## 🔧 Troubleshooting

### Issue: `metrics_batcher not running`
**Symptoms:** Health check shows `"running": false`

**Fix:**
```bash
# Check backend logs
docker logs backend | grep -i "batcher"

# Common causes:
# 1. TimescaleDB auth failure → Check TIMESCALEDB_* env vars
# 2. Connection timeout → Check network/firewall
# 3. Startup crash → Check Python dependencies (psycopg2)

# Force restart
docker-compose restart backend
```

### Issue: `dropped_count increasing`
**Symptoms:** Metrics being dropped under load

**Fix:**
```bash
# Increase buffer size
export METRICS_MAX_BUFFER_SIZE=50000

# Decrease flush interval (more frequent writes)
export METRICS_FLUSH_INTERVAL=2.0

# Restart backend
docker-compose restart backend
```

### Issue: Grafana dashboards empty
**Symptoms:** Charts show "No data"

**Fix:**
```bash
# 1. Check datasource connection
curl http://admin:admin@grafana:3000/api/datasources/1

# 2. Verify TimescaleDB has data
psql -U postgres -d timescale -c "SELECT COUNT(*) FROM metrics;"

# 3. Test query manually
psql -U postgres -d timescale -c "
  SELECT time, metric_name, metric_value 
  FROM metrics 
  WHERE metric_name = 'model_accuracy' 
  LIMIT 5;
"

# 4. Restart Grafana
docker-compose restart grafana
```

### Issue: High TimescaleDB write latency
**Symptoms:** Flush taking >10 seconds

**Fix:**
```sql
-- Check for long-running queries
SELECT pid, NOW() - query_start AS duration, query 
FROM pg_stat_activity 
WHERE datname = 'timescale' AND state = 'active' 
ORDER BY duration DESC;

-- Kill blocking queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'timescale' AND state = 'idle in transaction';

-- Vacuum (if table bloat)
VACUUM ANALYZE metrics;
```

---

## 📝 Post-Deployment Tasks

### Day 1
- [ ] Monitor `/api/metrics/stats` every hour
- [ ] Check TimescaleDB disk usage
- [ ] Verify Grafana dashboards updating
- [ ] Review error logs for anomalies

### Week 1
- [ ] Compare IOPS (should be ~100x lower)
- [ ] Verify retention policy working (data older than 90 days deleted)
- [ ] Check compression efficiency
- [ ] Gather user feedback on dashboard performance

### Month 1
- [ ] Remove InfluxDB backup scripts (if any remain)
- [ ] Archive old InfluxDB data (if needed)
- [ ] Update documentation to remove InfluxDB references
- [ ] Consider adding Kafka if multi-consumer pattern needed

---

## 🎓 Training Team

### For Developers
**"How do I record metrics in my code?"**

**Old way (deprecated):**
```python
timescale_client.write_metric("accuracy", 0.95, model_id="model_1")
```

**New way:**
```python
from backend.lib.metrics_helper import record_model_metric

await record_model_metric("model_1", "accuracy", 0.95, tags={"env": "prod"})
```

### For Ops/DevOps
**"How do I monitor the metrics system?"**

1. Health: `curl https://api.yourapp.com/api/health`
2. Stats: `curl https://api.yourapp.com/api/metrics/stats`
3. Force flush: `curl -X POST https://api.yourapp.com/api/metrics/flush`

### For Data/Analytics Team
**"Where is the metrics data?"**

- **Database:** TimescaleDB (`timescale` database)
- **Table:** `metrics`
- **Grafana:** http://grafana.yourapp.com (TimescaleDB datasource)
- **Query example:**
  ```sql
  SELECT time, model_id, metric_name, metric_value 
  FROM metrics 
  WHERE metric_name = 'model_accuracy' 
  AND time > NOW() - INTERVAL '7 days';
  ```

---

## ✅ Success Criteria

### After 1 Week in Production

- ✅ Zero `dropped_count` in metrics stats
- ✅ TimescaleDB write IOPS reduced by >90%
- ✅ No increase in error rate
- ✅ Grafana dashboards showing real-time data
- ✅ No rollback required
- ✅ Team trained on new system

### Performance Targets

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Write IOPS | 500/sec | <5/sec | ✅ |
| Insert latency | 50ms | <5ms | ✅ |
| Buffer drops | N/A | 0 | ✅ |
| Dashboard load | 2-3s | <500ms | ✅ |

---

## 📚 Related Documentation

- `METRICS_BATCHING_COMPLETE.md` — Implementation details
- `backend/lib/metrics_batcher.py` — Code reference
- `grafana-provisioning/` — Grafana config
- `scripts/migrate-to-timescale.sql` — DB schema

---

## 🆘 Support Contacts

**Issues during deployment?**
- Check logs first: `docker logs backend | grep -i "metric\|error"`
- Test health: `curl /api/health | jq '.services.metrics_batcher'`
- Force flush: `curl -X POST /api/metrics/flush`
- Emergency rollback: See "Rollback Plan" section above

**Questions?**
- Implementation: See `METRICS_BATCHING_COMPLETE.md`
- Architecture: See `backend/lib/metrics_batcher.py` docstrings
- Performance tuning: Adjust `METRICS_*` env vars
