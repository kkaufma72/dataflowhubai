#!/bin/bash
# Apply TimescaleDB migration and configure PgBouncer

set -e

echo "🚀 Applying TimescaleDB migration..."

# Apply migration script
docker exec -i dataflow_timescaledb psql -U postgres -d timescale < scripts/migrate-to-timescale.sql

echo "✅ TimescaleDB hypertables created"

# Restart TimescaleDB to apply config changes
echo "🔄 Restarting TimescaleDB..."
docker-compose restart timescaledb

# Wait for it to be ready
sleep 5

# Test connection
echo "🧪 Testing TimescaleDB connection..."
docker exec dataflow_timescaledb psql -U postgres -d timescale -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"

echo "
✅ TimescaleDB Migration Complete!

Next steps:
1. Update backend code to use TimescaleClient
2. Test metric writes: docker-compose logs -f celery_worker_cpu
3. View metrics in Flower: http://localhost:5555
4. After testing, remove InfluxDB from docker-compose.yml

Created hypertables:
- metrics (general time-series)
- model_performance (ML metrics)  
- training_metrics (training logs)
- system_metrics (resource usage)
- data_quality_metrics (data health)

PgBouncer configuration available in docker-compose.yml (commented)
"
