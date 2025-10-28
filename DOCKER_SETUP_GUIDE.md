# 🐳 Docker Setup Guide for DataFlowHub AI

This guide explains how to set up and run all DataFlowHub AI services using Docker.

## 📋 Prerequisites

- Docker (v20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- Docker Compose (v2.0+) - Usually included with Docker Desktop
- 8GB+ RAM available for containers
- 20GB+ disk space for data volumes

## 🚀 Quick Start

### 1. **Start All Services**

```bash
# Navigate to project root
cd /path/to/dataflowhubai

# Start all containers in background
docker-compose up -d

# View logs
docker-compose logs -f
```

### 2. **Verify Services Are Running**

```bash
# Check all containers
docker-compose ps

# Expected output:
# NAME                      STATUS
# dataflow_postgres         Up (healthy)
# dataflow_redis            Up (healthy)
# dataflow_neo4j            Up (healthy)
# dataflow_minio            Up (healthy)
# dataflow_timescaledb      Up (healthy)
# dataflow_kafka            Up (healthy)
# dataflow_zookeeper        Up (healthy)
# dataflow_prometheus       Up (healthy)
# dataflow_grafana          Up (healthy)
```

### 3. **Access Services**

| Service | URL | Credentials |
|---------|-----|-------------|
| **Neo4j Browser** | http://localhost:7474 | neo4j / dataflow_secure_password |
| **Grafana** | http://localhost:3000 | admin / admin |
| **Prometheus** | http://localhost:9090 | (no auth) |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin_secure_password |
| **PostgreSQL** | localhost:5432 | dataflow_user / dataflow_secure_password |
| **Redis** | localhost:6379 | (no auth by default) |
| **Kafka** | localhost:9092 | (no auth) |
| **TimescaleDB** | localhost:5433 | tsdata_user / timescale_secure_password |

---

## 🔧 Service Configuration

### PostgreSQL (Primary Data Warehouse)

**Port:** 5432
**Database:** dataflow_hub
**User:** dataflow_user

#### Connection String:
```
postgresql://dataflow_user:dataflow_secure_password@localhost:5432/dataflow_hub
```

#### Initialize Database:
```bash
# Run migrations automatically (via docker-entrypoint-initdb.d)
# Or manually connect:
psql -h localhost -U dataflow_user -d dataflow_hub -f warehouse-init.sql
```

---

### Redis (Caching & Real-time Data)

**Port:** 6379

#### Connect from CLI:
```bash
redis-cli -h localhost -p 6379
```

#### Common Commands:
```bash
# Set a value
SET mykey "Hello"

# Get a value
GET mykey

# Monitor in real-time
MONITOR

# Check memory usage
INFO memory
```

---

### Neo4j (Knowledge Graph)

**Bolt Port:** 7687
**HTTP Port:** 7474
**HTTPS Port:** 7473
**User:** neo4j
**Password:** dataflow_secure_password

#### Connect:
```bash
# Using cypher-shell
cypher-shell -a neo4j://neo4j@localhost:7687

# Or access web interface
# Navigate to http://localhost:7474
```

#### Load Test Data:
```bash
cypher-shell -a neo4j://neo4j@localhost:7687 -f NEO4J_TEST_DATA.cypher
```

---

### MinIO (S3-Compatible Object Storage)

**API Port:** 9000
**Console Port:** 9001
**Access Key:** minioadmin
**Secret Key:** minioadmin_secure_password

#### Access Console:
```
http://localhost:9001
```

#### Create Bucket:
```bash
docker exec dataflow_minio minio mc mb minio/datasets
docker exec dataflow_minio minio mc mb minio/models
docker exec dataflow_minio minio mc mb minio/cache
```

---

### Kafka (Event Streaming)

**Port:** 9092

#### Create Topics:
```bash
docker exec dataflow_kafka kafka-topics.sh \
  --create \
  --topic data-ingestion \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

docker exec dataflow_kafka kafka-topics.sh \
  --create \
  --topic model-predictions \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

#### Produce Messages:
```bash
docker exec -i dataflow_kafka kafka-console-producer.sh \
  --broker-list localhost:9092 \
  --topic data-ingestion
```

#### Consume Messages:
```bash
docker exec dataflow_kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic data-ingestion \
  --from-beginning
```

---

### Prometheus (Metrics Collection)

**Port:** 9090

#### Access:
```
http://localhost:9090
```

#### Query Metrics:
- Explore Graph → Enter metric name
- Example: `up` (shows service health)

---

### Grafana (Visualization & Dashboards)

**Port:** 3000
**Default Credentials:** admin / admin

#### Setup:
1. Navigate to http://localhost:3000
2. Login with admin/admin
3. Add Prometheus as data source (http://prometheus:9090)
4. Import dashboards from [Grafana Dashboard Library](https://grafana.com/grafana/dashboards/)

---

## 📊 Data Management

### Backup Databases

```bash
# Backup PostgreSQL
docker exec dataflow_postgres pg_dump -U dataflow_user dataflow_hub > backup.sql

# Backup Neo4j
docker exec dataflow_neo4j neo4j-admin dump --database=neo4j --to=/var/lib/neo4j/backup/

# Backup Redis
docker exec dataflow_redis redis-cli BGSAVE
docker cp dataflow_redis:/data/dump.rdb ./redis-backup.rdb
```

### Restore Databases

```bash
# Restore PostgreSQL
psql -h localhost -U dataflow_user -d dataflow_hub < backup.sql

# Restore Neo4j
# Copy backup file to container and restore

# Restore Redis
docker cp redis-backup.rdb dataflow_redis:/data/dump.rdb
docker exec dataflow_redis redis-cli SHUTDOWN
docker-compose up -d redis
```

---

## 🔍 Monitoring & Logging

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs postgres
docker-compose logs redis
docker-compose logs neo4j

# Follow logs in real-time
docker-compose logs -f kafka

# Last 100 lines
docker-compose logs --tail 100
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Manual health check
docker exec dataflow_postgres pg_isready -U dataflow_user
docker exec dataflow_redis redis-cli PING
docker exec dataflow_neo4j cypher-shell "RETURN 1"
```

---

## 🛠️ Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs service_name

# Inspect container
docker inspect dataflow_postgres

# Rebuild image
docker-compose up --build service_name
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5432

# Change port in docker-compose.yml
# Or kill existing process
kill -9 <PID>
```

### Out of Disk Space

```bash
# Clean up Docker
docker system prune -a

# Remove specific volume
docker volume rm dataflow_postgres_data
```

### Memory Issues

```bash
# Check Docker memory usage
docker stats

# Limit service memory in docker-compose.yml:
# mem_limit: 512m
# memswap_limit: 512m
```

---

## 🧹 Cleanup

### Stop Services

```bash
# Stop all containers
docker-compose stop

# Stop specific service
docker-compose stop postgres

# Stop and remove containers
docker-compose down

# Stop, remove containers, and delete volumes
docker-compose down -v
```

### Clean Up Volumes

```bash
# List volumes
docker volume ls

# Remove unused volumes
docker volume prune

# Remove specific volume
docker volume rm dataflow_postgres_data
```

---

## 📝 Environment Variables

### PostgreSQL
- `POSTGRES_USER`: dataflow_user
- `POSTGRES_PASSWORD`: dataflow_secure_password
- `POSTGRES_DB`: dataflow_hub

### Neo4j
- `NEO4J_AUTH`: neo4j/dataflow_secure_password
- `NEO4J_PLUGINS`: ["apoc"]
- `NEO4J_dbms_memory_heap_max__size`: 2G

### MinIO
- `MINIO_ROOT_USER`: minioadmin
- `MINIO_ROOT_PASSWORD`: minioadmin_secure_password

### Redis
- Redis runs without authentication by default
- To enable: Add `requirepass` to redis.conf

---

## 🔐 Security Best Practices

1. **Change Default Credentials**
   - Update passwords in docker-compose.yml
   - Use strong, unique passwords

2. **Use Environment Files**
   ```bash
   # Create .env file
   POSTGRES_PASSWORD=your_secure_password
   NEO4J_PASSWORD=your_secure_password
   # Reference in docker-compose.yml
   ```

3. **Network Isolation**
   - Services communicate via `dataflow_network`
   - Not exposed to host network (except ports)

4. **Firewall Rules**
   - Restrict port access on production
   - Use private networks for internal services

5. **Backup Strategy**
   - Regularly backup critical data
   - Test restore procedures

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Neo4j Docker Hub](https://hub.docker.com/_/neo4j)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

---

## 🚀 Next Steps

1. **Initialize Data**
   - Load sample data into databases
   - Create Kafka topics
   - Set up MinIO buckets

2. **Connect Application**
   - Update connection strings in .env
   - Run database migrations
   - Start the application

3. **Monitor & Scale**
   - View Grafana dashboards
   - Check Prometheus metrics
   - Scale services as needed

4. **Production Deployment**
   - Use Docker Swarm or Kubernetes
   - Implement load balancing
   - Set up high availability

---

## ❓ Support

For issues or questions:
1. Check Docker logs: `docker-compose logs`
2. Review service documentation
3. Contact support: support@dataflowhubai.com
