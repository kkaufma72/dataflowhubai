# 🏢 PostgreSQL Data Warehouse Setup

## 🎯 Architecture

**Two-Database Strategy:**

```
┌─────────────────────┐
│ Supabase PostgreSQL │ ← Operational Database (OLTP)
│ (App data)          │   - Users, datasets, models
│ Fast writes/reads   │   - Real-time operations
└─────────────────────┘
         ↓ ETL Pipeline
┌─────────────────────┐
│ PostgreSQL          │ ← Data Warehouse (OLAP)
│ (Analytics)         │   - Historical data
│ Optimized for       │   - Aggregations
│ complex queries     │   - Reporting
└─────────────────────┘
```

**Benefits:**
- ✅ Separate analytics from app (performance)
- ✅ Complex queries don't slow down app
- ✅ Store historical snapshots
- ✅ Run data transformations
- ✅ Business intelligence queries

---

## 🐳 Quick Setup (5 Minutes)

### Step 1: Run PostgreSQL Data Warehouse

```bash
# Create PostgreSQL container for data warehouse
docker run -d \
  --name postgres-warehouse \
  -e POSTGRES_PASSWORD=warehouse2024 \
  -e POSTGRES_USER=analytics \
  -e POSTGRES_DB=datawarehouse \
  -p 5433:5432 \
  -v postgres_warehouse_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Verify it's running
docker ps | grep postgres-warehouse
```

**Note:** Using port `5433` (not 5432) to avoid conflict with Supabase local

---

### Step 2: Install PostgreSQL Client

```bash
cd /Users/kyledev/dataflowhubai
npm install pg
```

---

### Step 3: Test Connection

```bash
# Connect with psql
docker exec -it postgres-warehouse psql -U analytics -d datawarehouse

# Or from your machine (if you have psql)
psql postgresql://analytics:warehouse2024@localhost:5433/datawarehouse
```

---

## 📊 Data Warehouse Schema

### Create Analytics Tables:

```sql
-- Dataset Analytics (Snapshots over time)
CREATE TABLE dim_datasets (
  dataset_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ,
  last_analyzed_at TIMESTAMPTZ,
  total_rows BIGINT,
  total_columns INT,
  file_size_bytes BIGINT,
  metadata JSONB
);

-- User Analytics
CREATE TABLE dim_users (
  user_id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company TEXT,
  job_title TEXT,
  use_case TEXT,
  signup_date TIMESTAMPTZ,
  last_active TIMESTAMPTZ,
  total_datasets INT DEFAULT 0,
  total_analyses INT DEFAULT 0
);

-- Analysis Events (Fact Table)
CREATE TABLE fact_analysis_events (
  event_id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES dim_users(user_id),
  dataset_id UUID REFERENCES dim_datasets(dataset_id),
  event_type TEXT, -- 'upload', 'analyze', 'train', 'chat'
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INT,
  success BOOLEAN,
  metadata JSONB
);

-- Daily Aggregations (Pre-computed)
CREATE TABLE agg_daily_usage (
  date DATE PRIMARY KEY,
  total_uploads INT,
  total_analyses INT,
  total_ai_chats INT,
  total_model_trains INT,
  unique_users INT,
  total_rows_processed BIGINT,
  avg_dataset_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dataset Health Scores (Time Series)
CREATE TABLE fact_dataset_health (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID REFERENCES dim_datasets(dataset_id),
  snapshot_date TIMESTAMPTZ DEFAULT NOW(),
  health_score INT,
  missing_values_pct DECIMAL(5,2),
  duplicate_rows_pct DECIMAL(5,2),
  outliers_count INT,
  quality_grade TEXT, -- 'A', 'B', 'C', 'D', 'F'
  recommendations JSONB
);

-- ML Model Performance (Time Series)
CREATE TABLE fact_model_performance (
  id BIGSERIAL PRIMARY KEY,
  model_id TEXT,
  model_name TEXT,
  dataset_id UUID,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  accuracy DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall_score DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  training_time_sec INT,
  hyperparameters JSONB
);

-- Create indexes for fast queries
CREATE INDEX idx_analysis_events_user ON fact_analysis_events(user_id, event_timestamp DESC);
CREATE INDEX idx_analysis_events_dataset ON fact_analysis_events(dataset_id);
CREATE INDEX idx_analysis_events_type ON fact_analysis_events(event_type);
CREATE INDEX idx_dataset_health_date ON fact_dataset_health(snapshot_date DESC);
CREATE INDEX idx_model_performance_date ON fact_model_performance(recorded_at DESC);
```

---

## 🔌 Connect to Your App

### Create `src/lib/dataWarehouse.ts`:

```typescript
import { Pool } from 'pg';

// PostgreSQL Data Warehouse Connection
const warehousePool = new Pool({
  host: 'localhost',
  port: 5433, // Custom port to avoid conflict
  database: 'datawarehouse',
  user: 'analytics',
  password: 'warehouse2024',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Log dataset upload to warehouse
 */
export const logDatasetUpload = async (dataset: any, userId: string) => {
  const query = `
    INSERT INTO dim_datasets (
      dataset_id, name, description, file_type, created_at,
      total_rows, total_columns, file_size_bytes, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (dataset_id) DO UPDATE SET
      last_analyzed_at = NOW(),
      total_rows = EXCLUDED.total_rows,
      total_columns = EXCLUDED.total_columns
  `;

  await warehousePool.query(query, [
    dataset.id,
    dataset.name,
    dataset.description,
    dataset.file_type,
    dataset.created_at,
    dataset.row_count || 0,
    dataset.column_count || 0,
    0, // file_size_bytes (calculate if needed)
    JSON.stringify(dataset.metadata || {})
  ]);

  // Log event
  await logAnalysisEvent(userId, dataset.id, 'upload', true);
};

/**
 * Log analysis event
 */
export const logAnalysisEvent = async (
  userId: string,
  datasetId: string,
  eventType: string,
  success: boolean,
  durationMs?: number
) => {
  const query = `
    INSERT INTO fact_analysis_events (
      user_id, dataset_id, event_type, success, duration_ms
    ) VALUES ($1, $2, $3, $4, $5)
  `;

  await warehousePool.query(query, [
    userId,
    datasetId,
    eventType,
    success,
    durationMs || 0
  ]);
};

/**
 * Get daily usage statistics
 */
export const getDailyUsageStats = async (days: number = 30) => {
  const query = `
    SELECT 
      date,
      total_uploads,
      total_analyses,
      total_ai_chats,
      unique_users
    FROM agg_daily_usage
    WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
    ORDER BY date DESC
  `;

  const result = await warehousePool.query(query);
  return result.rows;
};

/**
 * Get top datasets by usage
 */
export const getTopDatasets = async (limit: number = 10) => {
  const query = `
    SELECT 
      d.name,
      d.total_rows,
      COUNT(e.event_id) as analysis_count,
      MAX(e.event_timestamp) as last_used
    FROM dim_datasets d
    LEFT JOIN fact_analysis_events e ON d.dataset_id = e.dataset_id
    GROUP BY d.dataset_id, d.name, d.total_rows
    ORDER BY analysis_count DESC
    LIMIT $1
  `;

  const result = await warehousePool.query(query, [limit]);
  return result.rows;
};

/**
 * Get dataset health trends
 */
export const getDatasetHealthTrends = async (datasetId: string, days: number = 30) => {
  const query = `
    SELECT 
      snapshot_date,
      health_score,
      missing_values_pct,
      quality_grade
    FROM fact_dataset_health
    WHERE dataset_id = $1
      AND snapshot_date >= NOW() - INTERVAL '${days} days'
    ORDER BY snapshot_date ASC
  `;

  const result = await warehousePool.query(query, [datasetId]);
  return result.rows;
};

/**
 * Aggregate daily stats (run this daily via cron)
 */
export const aggregateDailyStats = async () => {
  const query = `
    INSERT INTO agg_daily_usage (
      date,
      total_uploads,
      total_analyses,
      total_ai_chats,
      total_model_trains,
      unique_users
    )
    SELECT 
      CURRENT_DATE,
      SUM(CASE WHEN event_type = 'upload' THEN 1 ELSE 0 END),
      SUM(CASE WHEN event_type = 'analyze' THEN 1 ELSE 0 END),
      SUM(CASE WHEN event_type = 'chat' THEN 1 ELSE 0 END),
      SUM(CASE WHEN event_type = 'train' THEN 1 ELSE 0 END),
      COUNT(DISTINCT user_id)
    FROM fact_analysis_events
    WHERE event_timestamp::date = CURRENT_DATE
    ON CONFLICT (date) DO UPDATE SET
      total_uploads = EXCLUDED.total_uploads,
      total_analyses = EXCLUDED.total_analyses,
      total_ai_chats = EXCLUDED.total_ai_chats,
      unique_users = EXCLUDED.unique_users
  `;

  await warehousePool.query(query);
};

export default warehousePool;
```

---

## 🔄 ETL Pipeline (Supabase → Warehouse)

### Option A: Supabase Edge Function (Automated)

Create `supabase/functions/sync-to-warehouse/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import postgres from 'npm:postgres@3';

serve(async (req) => {
  try {
    // Connect to warehouse
    const sql = postgres({
      host: 'your-warehouse-host',
      port: 5433,
      database: 'datawarehouse',
      username: 'analytics',
      password: Deno.env.get('WAREHOUSE_PASSWORD'),
    });

    // Get recent datasets from Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_KEY')!
    );

    const { data: datasets } = await supabase
      .from('datasets')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());

    // Insert into warehouse
    for (const dataset of datasets || []) {
      await sql`
        INSERT INTO dim_datasets (
          dataset_id, name, description, file_type, created_at,
          total_rows, total_columns, metadata
        ) VALUES (
          ${dataset.id}, ${dataset.name}, ${dataset.description},
          ${dataset.file_type}, ${dataset.created_at},
          ${dataset.row_count}, ${dataset.column_count}, ${dataset.metadata}
        )
        ON CONFLICT (dataset_id) DO UPDATE SET
          last_analyzed_at = NOW()
      `;
    }

    await sql.end();

    return new Response(
      JSON.stringify({ synced: datasets?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

---

### Option B: Client-Side Logging

Update your components to log to warehouse:

```typescript
// In DataManagement.tsx, after dataset upload
import { logDatasetUpload, logAnalysisEvent } from '../lib/dataWarehouse';

const handleUploadComplete = async (dataset: Dataset) => {
  // 1. Save to Supabase (operational)
  await supabase.from('datasets').insert(dataset);
  
  // 2. Log to warehouse (analytics)
  try {
    await logDatasetUpload(dataset, user.id);
  } catch (error) {
    console.warn('Warehouse logging failed:', error);
    // Don't block user if warehouse is down
  }
};
```

---

## 📊 Analytics Dashboard Component

Create `src/components/analytics/WarehouseAnalytics.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { getDailyUsageStats, getTopDatasets } from '../../lib/dataWarehouse';
import { BarChart2, TrendingUp, Users } from 'lucide-react';
import Card from '../common/Card';

const WarehouseAnalytics = () => {
  const [usageStats, setUsageStats] = useState([]);
  const [topDatasets, setTopDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [usage, top] = await Promise.all([
        getDailyUsageStats(30),
        getTopDatasets(10)
      ]);
      setUsageStats(usage);
      setTopDatasets(top);
    } catch (error) {
      console.error('Analytics load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          📊 Data Warehouse Analytics
        </h2>

        {/* Top Datasets */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Most Analyzed Datasets
          </h3>
          <div className="space-y-2">
            {topDatasets.map((ds, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">{ds.name}</p>
                  <p className="text-sm text-gray-600">
                    {ds.total_rows?.toLocaleString()} rows
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">
                    {ds.analysis_count}
                  </p>
                  <p className="text-xs text-gray-500">analyses</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WarehouseAnalytics;
```

---

## 🔄 Sample ETL Queries

### Copy Data from Supabase to Warehouse:

```sql
-- In warehouse, create foreign data wrapper (FDW) to Supabase
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER supabase_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'db.your-project.supabase.co', dbname 'postgres', port '5432');

CREATE USER MAPPING FOR analytics
  SERVER supabase_server
  OPTIONS (user 'postgres', password 'your-supabase-password');

-- Import Supabase datasets table
IMPORT FOREIGN SCHEMA public
  LIMIT TO (datasets, models)
  FROM SERVER supabase_server
  INTO public;

-- Now you can query Supabase data directly!
SELECT * FROM datasets;

-- ETL: Copy to warehouse dimension table
INSERT INTO dim_datasets
SELECT 
  id as dataset_id,
  name,
  description,
  file_type,
  created_at,
  NOW() as last_analyzed_at,
  row_count as total_rows,
  column_count as total_columns,
  0 as file_size_bytes,
  '{}'::jsonb as metadata
FROM datasets
ON CONFLICT (dataset_id) DO NOTHING;
```

---

## 📈 Analytics Queries

### Business Intelligence Queries:

```sql
-- 1. User Engagement Metrics
SELECT 
  u.company,
  u.use_case,
  COUNT(DISTINCT e.dataset_id) as datasets_used,
  COUNT(e.event_id) as total_actions,
  AVG(CASE WHEN e.event_type = 'analyze' THEN e.duration_ms END) as avg_analysis_time_ms
FROM dim_users u
JOIN fact_analysis_events e ON u.user_id = e.user_id
WHERE e.event_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY u.company, u.use_case
ORDER BY total_actions DESC;

-- 2. Dataset Quality Trends
SELECT 
  d.name,
  DATE(h.snapshot_date) as date,
  AVG(h.health_score) as avg_health,
  AVG(h.missing_values_pct) as avg_missing_pct
FROM dim_datasets d
JOIN fact_dataset_health h ON d.dataset_id = h.dataset_id
WHERE h.snapshot_date >= NOW() - INTERVAL '7 days'
GROUP BY d.name, DATE(h.snapshot_date)
ORDER BY date DESC;

-- 3. Most Active Hours
SELECT 
  EXTRACT(HOUR FROM event_timestamp) as hour,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM fact_analysis_events
WHERE event_timestamp >= CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM event_timestamp)
ORDER BY hour;

-- 4. Model Performance Over Time
SELECT 
  model_name,
  DATE(recorded_at) as date,
  AVG(accuracy) as avg_accuracy,
  AVG(f1_score) as avg_f1,
  COUNT(*) as training_runs
FROM fact_model_performance
WHERE recorded_at >= NOW() - INTERVAL '30 days'
GROUP BY model_name, DATE(recorded_at)
ORDER BY date DESC, avg_accuracy DESC;

-- 5. Power Users (Most Active)
SELECT 
  u.email,
  u.company,
  COUNT(DISTINCT e.dataset_id) as datasets_analyzed,
  COUNT(e.event_id) as total_actions,
  MAX(e.event_timestamp) as last_active
FROM dim_users u
JOIN fact_analysis_events e ON u.user_id = e.user_id
GROUP BY u.user_id, u.email, u.company
ORDER BY total_actions DESC
LIMIT 20;
```

---

## 🐳 Docker Compose (Recommended)

Create `docker-compose.warehouse.yml`:

```yaml
version: '3.8'

services:
  postgres-warehouse:
    image: postgres:16-alpine
    container_name: postgres-warehouse
    environment:
      POSTGRES_USER: analytics
      POSTGRES_PASSWORD: warehouse2024
      POSTGRES_DB: datawarehouse
      POSTGRES_INITDB_ARGS: "-E UTF8"
    ports:
      - "5433:5432"
    volumes:
      - postgres_warehouse_data:/var/lib/postgresql/data
      - ./warehouse-init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U analytics"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Optional: pgAdmin for warehouse management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin-warehouse
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@dataflowhub.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres-warehouse

volumes:
  postgres_warehouse_data:
```

**Start:**
```bash
docker-compose -f docker-compose.warehouse.yml up -d
```

**Access pgAdmin:**
```
http://localhost:5050
Email: admin@dataflowhub.com
Password: admin
```

---

## 🚀 Production Deployment

### Option A: Supabase (Separate Project)

Create second Supabase project for warehouse:
- Free tier: Good for analytics
- Managed: No server maintenance
- Cost: $0-25/month

### Option B: Railway/Render

```bash
# Railway
railway init
railway add postgresql
# Get connection string from dashboard

# Render
# Create PostgreSQL database
# Copy connection string
```

### Option C: AWS RDS

```bash
# Create RDS PostgreSQL instance
# Instance type: db.t3.medium
# Storage: 100GB
# Enable automated backups
```

---

## 📊 Environment Variables

Add to `.env.local`:

```bash
# Data Warehouse
VITE_WAREHOUSE_HOST=localhost
VITE_WAREHOUSE_PORT=5433
VITE_WAREHOUSE_DB=datawarehouse
VITE_WAREHOUSE_USER=analytics
VITE_WAREHOUSE_PASSWORD=warehouse2024
```

---

## 🎯 Quick Commands

```bash
# Start warehouse
docker run -d --name postgres-warehouse \
  -e POSTGRES_PASSWORD=warehouse2024 \
  -e POSTGRES_USER=analytics \
  -e POSTGRES_DB=datawarehouse \
  -p 5433:5432 \
  postgres:16-alpine

# Connect
docker exec -it postgres-warehouse psql -U analytics -d datawarehouse

# Run schema
docker exec -i postgres-warehouse psql -U analytics -d datawarehouse < warehouse-schema.sql

# Backup
docker exec postgres-warehouse pg_dump -U analytics datawarehouse > backup.sql

# Restore
docker exec -i postgres-warehouse psql -U analytics -d datawarehouse < backup.sql
```

---

## ✅ Summary

**Setup:**
1. Run PostgreSQL on port 5433
2. Create data warehouse schema
3. Connect from app
4. Log events to warehouse
5. Query for analytics

**Use Cases:**
- Historical data analysis
- Business intelligence
- User behavior tracking
- Model performance trends
- Dataset health monitoring

**Next Steps:**
1. Run Docker command
2. Create schema (SQL above)
3. Add `src/lib/dataWarehouse.ts`
4. Start logging events
5. Build analytics dashboard

**Your data warehouse is ready!** 🏢📊

Want me to implement this now?

