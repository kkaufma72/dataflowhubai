# Backend Scripts

This directory contains utility scripts for database initialization, testing, and maintenance.

## TimescaleDB Scripts

### Setup TimescaleDB
Initializes TimescaleDB with hypertables, continuous aggregates, and policies.

```bash
python scripts/setup_timescaledb.py
```

**What it does:**
- Connects to TimescaleDB container (localhost:5433)
- Executes `init_timescaledb.sql` to create all tables
- Converts tables to hypertables
- Sets up continuous aggregates for hourly rollups
- Configures retention policies (90 days)
- Configures compression policies (7 days)
- Verifies all tables were created successfully

**When to run:**
- First time setting up the platform
- After dropping/recreating the TimescaleDB database
- After modifying `init_timescaledb.sql`

### Test TimescaleDB API
Tests all TimescaleDB metrics endpoints with sample data.

```bash
# Update TEST_USER_TOKEN in the script first
python scripts/test_timescaledb_api.py
```

**What it tests:**
1. Record model metrics (POST)
2. Get model metrics (GET with filters)
3. Get aggregated metrics (GET with time buckets)
4. Log predictions (POST)
5. Get prediction statistics (GET)
6. Record training metrics (POST)
7. Get training history (GET)

**Requirements:**
- FastAPI backend running on localhost:8000
- Valid authentication token (update TEST_USER_TOKEN variable)
- TimescaleDB initialized and running

## Usage Examples

### Full Setup Flow
```bash
# 1. Ensure Docker services are running
docker-compose up -d

# 2. Install Python dependencies
cd backend
pip install -r requirements.txt

# 3. Initialize TimescaleDB
python scripts/setup_timescaledb.py

# 4. Start FastAPI backend
uvicorn main:app --reload --port 8000

# 5. (In another terminal) Test the endpoints
python scripts/test_timescaledb_api.py
```

### Manual Database Connection
```bash
# Connect to TimescaleDB container
docker exec -it dataflow_timescaledb psql -U tsdata_user -d timeseries_db

# List hypertables
SELECT * FROM timescaledb_information.hypertables;

# Check data
SELECT * FROM model_metrics ORDER BY time DESC LIMIT 10;
```

## Troubleshooting

### Setup script fails with "database does not exist"
```bash
# Create the database manually
docker exec -it dataflow_timescaledb psql -U tsdata_user -c "CREATE DATABASE timeseries_db;"

# Then run setup again
python scripts/setup_timescaledb.py
```

### Test script fails with "Connection refused"
- Ensure FastAPI backend is running: `uvicorn main:app --reload --port 8000`
- Check if TimescaleDB container is running: `docker ps | grep timescaledb`

### Authentication errors in tests
- Update `TEST_USER_TOKEN` in `test_timescaledb_api.py` with a valid JWT token
- Get token by signing in through the frontend or using the auth endpoint

## File Descriptions

- **`init_timescaledb.sql`** - SQL script that creates all hypertables, indexes, continuous aggregates, and policies
- **`setup_timescaledb.py`** - Python script that executes the SQL initialization and verifies success
- **`test_timescaledb_api.py`** - Automated test suite for all TimescaleDB API endpoints

## Related Documentation

- **TimescaleDB Guide**: `../TIMESCALEDB_GUIDE.md` - Comprehensive usage guide
- **Implementation Summary**: `../TIMESCALEDB_COMPLETE.md` - What was built and why
- **Service Layer**: `../services/timescale_service.py` - Core business logic
- **API Routes**: `../routers/monitoring_routes.py` - REST endpoints
