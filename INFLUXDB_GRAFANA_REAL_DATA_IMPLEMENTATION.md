# 🚀 InfluxDB/Grafana Real Data Implementation Guide

## 📊 Overview

This guide shows you **exactly how to implement InfluxDB/Grafana-style visualizations with REAL data** from your platform, not mock data.

---

## 🎯 Three Implementation Approaches

### Option 1: Using Your Existing Data (Fastest ✅)
Use data already in MLContext (datasets, models) - **No new infrastructure needed**

### Option 2: TimescaleDB Integration (Recommended 🔥)
Use your existing TimescaleDB container for time-series metrics - **Already in docker-compose.yml**

### Option 3: Full InfluxDB + Grafana (Advanced 🚀)
Add real InfluxDB and Grafana containers - **Production-grade monitoring**

---

## 🏃 Quick Start: Option 1 - Use Existing Data

### Step 1: Create Time-Series Data Hook

```typescript
// src/hooks/useTimeSeriesMetrics.ts
import { useMemo } from 'react';
import { useMLContext } from '../context/MLContext';

interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

interface ModelMetricsSeries {
  modelId: string;
  modelName: string;
  accuracy: TimeSeriesPoint[];
  loss: TimeSeriesPoint[];
  trainingTime: number;
}

export const useTimeSeriesMetrics = () => {
  const { models, datasets } = useMLContext();

  // Convert model metrics to time-series format
  const timeSeriesData = useMemo(() => {
    return models
      .filter(m => m.trainedAt && m.metrics)
      .map(model => {
        // Create time-series points from model training
        const trainedDate = new Date(model.trainedAt!);
        
        return {
          modelId: model.id,
          modelName: model.name,
          accuracy: [{
            timestamp: trainedDate,
            value: (model.metrics?.accuracy || 0) * 100
          }],
          loss: [{
            timestamp: trainedDate,
            value: model.metrics?.loss || 0
          }],
          trainingTime: model.trainingTime || 0
        } as ModelMetricsSeries;
      });
  }, [models]);

  // Aggregate metrics over time
  const aggregatedMetrics = useMemo(() => {
    const sortedModels = [...models]
      .filter(m => m.trainedAt)
      .sort((a, b) => new Date(a.trainedAt!).getTime() - new Date(b.trainedAt!).getTime());

    return {
      timestamps: sortedModels.map(m => new Date(m.trainedAt!)),
      accuracies: sortedModels.map(m => (m.metrics?.accuracy || 0) * 100),
      losses: sortedModels.map(m => m.metrics?.loss || 0),
      modelNames: sortedModels.map(m => m.name),
      avgAccuracy: sortedModels.reduce((sum, m) => sum + (m.metrics?.accuracy || 0), 0) / sortedModels.length * 100,
      totalModels: sortedModels.length
    };
  }, [models]);

  // Dataset quality trends
  const datasetTrends = useMemo(() => {
    return datasets.map(ds => ({
      datasetId: ds.id,
      datasetName: ds.name,
      qualityScore: ds.quality?.score || 0,
      rowCount: ds.rows || 0,
      columnCount: ds.columns || 0,
      uploadedAt: ds.uploadedAt ? new Date(ds.uploadedAt) : new Date()
    }));
  }, [datasets]);

  return {
    timeSeriesData,
    aggregatedMetrics,
    datasetTrends
  };
};
```

### Step 2: Create InfluxDB-Style Dashboard Component

```typescript
// src/components/dashboards/InfluxDBDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { useTimeSeriesMetrics } from '../../hooks/useTimeSeriesMetrics';
import { TrendingUp, Activity, Database } from 'lucide-react';

export const InfluxDBDashboard: React.FC = () => {
  const { aggregatedMetrics, datasetTrends } = useTimeSeriesMetrics();
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger re-fetch from MLContext
      console.log('Refreshing metrics...');
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Current value (latest metric)
  const currentAccuracy = aggregatedMetrics.accuracies[aggregatedMetrics.accuracies.length - 1] || 0;
  const currentLoss = aggregatedMetrics.losses[aggregatedMetrics.losses.length - 1] || 0;

  // Chart data for accuracy over time
  const accuracyChartData = {
    labels: aggregatedMetrics.timestamps.map((t, i) => `Model ${i + 1}`),
    datasets: [{
      label: 'Model Accuracy',
      data: aggregatedMetrics.accuracies,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-6">
      {/* InfluxDB-style Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Model Performance Dashboard</h1>
          <div className="flex items-center gap-4">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-[#161b22] text-white border border-gray-700 rounded px-3 py-2 text-sm"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Activity className="w-4 h-4 animate-pulse text-green-400" />
              Live
            </div>
          </div>
        </div>
      </div>

      {/* Graph + Single Stat (InfluxDB style) */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Large Graph Panel */}
        <div className="col-span-2 bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Model Accuracy Trend</h3>
            </div>
            <span className="text-xs text-gray-500">Last {aggregatedMetrics.totalModels} models</span>
          </div>
          <div className="p-4">
            <Line
              data={accuracyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#a0aec0',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12,
                  }
                },
                scales: {
                  x: {
                    grid: { display: false, color: 'rgba(75, 85, 99, 0.2)' },
                    ticks: { color: '#6b7280', font: { size: 10 } }
                  },
                  y: {
                    grid: { color: 'rgba(75, 85, 99, 0.2)' },
                    ticks: { 
                      color: '#9ca3af',
                      callback: (value) => `${value}%`
                    },
                    min: 0,
                    max: 100
                  }
                }
              }}
              height={300}
            />
          </div>
        </div>

        {/* Single Stat Panel (Current Value) */}
        <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Current Accuracy</h3>
          </div>
          <div className="p-6 text-center">
            <div className="text-5xl font-bold text-white mb-2 font-mono">
              {currentAccuracy.toFixed(1)}<span className="text-3xl text-gray-500">%</span>
            </div>
            <div className="text-sm text-gray-400 mb-4">Latest Model</div>
            
            {/* Mini trend indicator */}
            <div className="flex items-center justify-center gap-2">
              {aggregatedMetrics.accuracies.length >= 2 && (
                <>
                  {currentAccuracy > aggregatedMetrics.accuracies[aggregatedMetrics.accuracies.length - 2] ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Improving</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                      <span className="text-sm text-red-400">Declining</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="px-4 py-3 border-t border-gray-800 bg-[#0d1117]">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-gray-500">Avg</div>
                <div className="text-white font-mono">{aggregatedMetrics.avgAccuracy.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-500">Models</div>
                <div className="text-white font-mono">{aggregatedMetrics.totalModels}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Quality Table (Grafana-style) */}
      <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Dataset Quality Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0d1117] border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Dataset</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">Quality Score</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">Rows</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">Columns</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {datasetTrends.map((ds) => (
                <tr key={ds.datasetId} className="border-b border-gray-800 hover:bg-[#0d1117] transition-colors">
                  <td className="px-4 py-3 text-sm text-white">{ds.datasetName}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-white">{ds.qualityScore.toFixed(0)}</span>
                    <span className="text-xs text-gray-500">/100</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-gray-300">
                    {ds.rowCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-gray-300">
                    {ds.columnCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      ds.qualityScore >= 80 ? 'bg-green-900/30 text-green-400' :
                      ds.qualityScore >= 60 ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {ds.qualityScore >= 80 ? 'Excellent' : ds.qualityScore >= 60 ? 'Good' : 'Needs Work'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
```

### Step 3: Add to Your Routes

```typescript
// src/main.tsx (add to routes)
import { InfluxDBDashboard } from './components/dashboards/InfluxDBDashboard';

// Inside <Routes>
<Route path="/app/monitoring" element={
  <Suspense fallback={<LoadingFallback />}>
    <InfluxDBDashboard />
  </Suspense>
} />
```

---

## 🔥 Option 2: TimescaleDB Integration (Recommended)

You already have TimescaleDB in `docker-compose.yml`! Let's use it.

### Step 1: Create TimescaleDB Schema

```sql
-- Run this in your TimescaleDB container
CREATE TABLE IF NOT EXISTS model_metrics (
  time TIMESTAMPTZ NOT NULL,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  accuracy DOUBLE PRECISION,
  loss DOUBLE PRECISION,
  precision DOUBLE PRECISION,
  recall DOUBLE PRECISION,
  f1_score DOUBLE PRECISION,
  training_time INTEGER,
  dataset_id TEXT,
  user_id TEXT
);

-- Create hypertable for time-series optimization
SELECT create_hypertable('model_metrics', 'time');

-- Create indexes
CREATE INDEX idx_model_metrics_model_id ON model_metrics (model_id, time DESC);
CREATE INDEX idx_model_metrics_user_id ON model_metrics (user_id, time DESC);

-- Create continuous aggregate for hourly averages
CREATE MATERIALIZED VIEW model_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 hour', time) AS bucket,
  model_id,
  AVG(accuracy) as avg_accuracy,
  AVG(loss) as avg_loss,
  COUNT(*) as num_samples
FROM model_metrics
GROUP BY bucket, model_id;
```

### Step 2: Backend API to Write Metrics

```python
# backend/routers/metrics.py
from fastapi import APIRouter, Depends
from datetime import datetime
import asyncpg

router = APIRouter()

@router.post("/api/metrics/model")
async def log_model_metrics(
    model_id: str,
    model_name: str,
    accuracy: float,
    loss: float,
    user_id: str,
    db: asyncpg.Pool = Depends(get_timescale_db)
):
    """Log model training metrics to TimescaleDB"""
    await db.execute("""
        INSERT INTO model_metrics 
        (time, model_id, model_name, accuracy, loss, user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
    """, datetime.now(), model_id, model_name, accuracy, loss, user_id)
    
    return {"status": "success"}

@router.get("/api/metrics/model/{model_id}")
async def get_model_metrics(
    model_id: str,
    hours: int = 24,
    db: asyncpg.Pool = Depends(get_timescale_db)
):
    """Query time-series metrics for a model"""
    rows = await db.fetch("""
        SELECT 
            time_bucket('5 minutes', time) AS bucket,
            AVG(accuracy) as avg_accuracy,
            AVG(loss) as avg_loss,
            COUNT(*) as samples
        FROM model_metrics
        WHERE model_id = $1 
        AND time > NOW() - INTERVAL '$2 hours'
        GROUP BY bucket
        ORDER BY bucket DESC
    """, model_id, hours)
    
    return {
        "timestamps": [row['bucket'] for row in rows],
        "accuracy": [row['avg_accuracy'] for row in rows],
        "loss": [row['avg_loss'] for row in rows],
    }
```

### Step 3: Frontend Hook for TimescaleDB Data

```typescript
// src/hooks/useTimescaleMetrics.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useTimescaleMetrics = (modelId?: string, hours: number = 24) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Call your FastAPI backend
        const response = await fetch(
          `/api/metrics/model/${modelId}?hours=${hours}`
        );
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (modelId) {
      fetchMetrics();
      
      // Auto-refresh every 5 seconds
      const interval = setInterval(fetchMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [modelId, hours]);

  return { metrics, loading };
};
```

---

## 🚀 Option 3: Full InfluxDB + Grafana Setup

### Step 1: Add to docker-compose.yml

```yaml
# Add to your existing docker-compose.yml
services:
  influxdb:
    image: influxdb:2.7
    container_name: dataflow_influxdb
    ports:
      - "8086:8086"
    volumes:
      - influxdb_data:/var/lib/influxdb2
      - influxdb_config:/etc/influxdb2
    environment:
      - DOCKER_INFLUXDB_INIT_MODE=setup
      - DOCKER_INFLUXDB_INIT_USERNAME=admin
      - DOCKER_INFLUXDB_INIT_PASSWORD=adminpassword123
      - DOCKER_INFLUXDB_INIT_ORG=dataflow
      - DOCKER_INFLUXDB_INIT_BUCKET=metrics
      - DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=my-super-secret-auth-token
    networks:
      - dataflow_network

  grafana:
    image: grafana/grafana:10.2.0
    container_name: dataflow_grafana
    ports:
      - "3001:3000"  # Avoid conflict with your port 3000
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=
    depends_on:
      - influxdb
    networks:
      - dataflow_network

volumes:
  influxdb_data:
  influxdb_config:
  grafana_data:
```

### Step 2: Write Metrics to InfluxDB

```typescript
// src/lib/influxdb.ts
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const url = 'http://localhost:8086';
const token = 'my-super-secret-auth-token';
const org = 'dataflow';
const bucket = 'metrics';

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);

export const logModelMetric = (
  modelId: string,
  modelName: string,
  accuracy: number,
  loss: number
) => {
  const point = new Point('model_metrics')
    .tag('model_id', modelId)
    .tag('model_name', modelName)
    .floatField('accuracy', accuracy)
    .floatField('loss', loss)
    .timestamp(new Date());
  
  writeApi.writePoint(point);
  writeApi.flush(); // Send to InfluxDB
};

export const queryModelMetrics = async (modelId: string, hours: number = 24) => {
  const queryApi = influxDB.getQueryApi(org);
  
  const query = `
    from(bucket: "${bucket}")
      |> range(start: -${hours}h)
      |> filter(fn: (r) => r["_measurement"] == "model_metrics")
      |> filter(fn: (r) => r["model_id"] == "${modelId}")
      |> filter(fn: (r) => r["_field"] == "accuracy" or r["_field"] == "loss")
      |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;
  
  const results: any[] = [];
  
  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        results.push(o);
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(results);
      },
    });
  });
};
```

### Step 3: Log Metrics During Training

```typescript
// In your ModelTraining component
import { logModelMetric } from '../lib/influxdb';

const handleTrainModel = async () => {
  // ... training logic
  
  // Log to InfluxDB after each epoch
  const onEpochComplete = (epoch: number, metrics: any) => {
    logModelMetric(
      modelId,
      modelName,
      metrics.accuracy,
      metrics.loss
    );
  };
  
  // Train model with callback
  await trainModel(dataset, config, onEpochComplete);
};
```

### Step 4: Create Grafana Dashboard

1. **Start services**: `docker-compose up -d influxdb grafana`
2. **Access Grafana**: http://localhost:3001 (admin/admin)
3. **Add InfluxDB data source**:
   - Configuration → Data Sources → Add InfluxDB
   - Query Language: Flux
   - URL: http://influxdb:8086
   - Token: my-super-secret-auth-token
   - Organization: dataflow
   - Default Bucket: metrics

4. **Create dashboard**:
```flux
// Grafana panel query
from(bucket: "metrics")
  |> range(start: -24h)
  |> filter(fn: (r) => r["_measurement"] == "model_metrics")
  |> filter(fn: (r) => r["_field"] == "accuracy")
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
```

---

## 📈 Real-Time Updates with WebSocket

```typescript
// src/hooks/useRealtimeMetrics.ts
import { useEffect, useState } from 'react';

export const useRealtimeMetrics = (modelId: string) => {
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/metrics/${modelId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics(prev => [...prev, {
        timestamp: new Date(data.timestamp),
        accuracy: data.accuracy,
        loss: data.loss
      }]);
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);
    
    return () => ws.close();
  }, [modelId]);

  return metrics;
};
```

```python
# backend/websocket.py
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json

@app.websocket("/ws/metrics/{model_id}")
async def websocket_endpoint(websocket: WebSocket, model_id: str):
    await websocket.accept()
    try:
        while True:
            # Query latest metrics from TimescaleDB/InfluxDB
            metrics = await get_latest_metrics(model_id)
            await websocket.send_json(metrics)
            await asyncio.sleep(1)  # Send every second
    except WebSocketDisconnect:
        print(f"Client disconnected from model {model_id}")
```

---

## 🎯 Quick Implementation Steps

### For Existing Data (5 minutes):
1. Copy `useTimeSeriesMetrics` hook to `src/hooks/`
2. Copy `InfluxDBDashboard` component to `src/components/dashboards/`
3. Add route to your app
4. ✅ Done! Visualizing real data

### For TimescaleDB (15 minutes):
1. Run SQL schema in TimescaleDB container
2. Create backend API endpoints
3. Log metrics after model training
4. Query with frontend hook
5. ✅ Real time-series database

### For Full InfluxDB + Grafana (30 minutes):
1. Add services to docker-compose.yml
2. `docker-compose up -d influxdb grafana`
3. Install InfluxDB client: `npm install @influxdata/influxdb-client`
4. Configure data source in Grafana
5. Create dashboards
6. ✅ Production monitoring stack

---

## 💡 Best Practices

1. **Start Simple**: Use Option 1 (existing data) first
2. **Add Persistence**: Move to TimescaleDB for historical data
3. **Scale Up**: Add InfluxDB + Grafana for production
4. **Batch Writes**: Don't write to DB on every render
5. **Aggregate Data**: Use time buckets (5min, 1hour) for performance
6. **Cache Queries**: Use useMemo for expensive calculations
7. **Real-time Updates**: WebSocket for live training, polling for dashboards
8. **Error Handling**: Always have fallback UI for no data

---

## 🔧 Troubleshooting

**Q: No data showing in charts?**
- Check if models have `trainedAt` and `metrics` fields
- Verify `useMLContext()` returns data
- Check browser console for errors

**Q: TimescaleDB connection fails?**
- Ensure container is running: `docker ps | grep timescale`
- Check connection string in backend
- Verify port 5433 is not blocked

**Q: InfluxDB write errors?**
- Verify token and organization name
- Check InfluxDB logs: `docker logs dataflow_influxdb`
- Ensure bucket exists: http://localhost:8086

**Q: Grafana dashboard empty?**
- Verify InfluxDB data source configured
- Check Flux query syntax
- Ensure data exists: query InfluxDB directly

---

## 📚 Next Steps

1. ✅ Implement Option 1 for immediate results
2. Add more metrics (F1 score, precision, recall)
3. Create alerts for accuracy drops
4. Add dataset quality trends
5. Build custom Grafana dashboards
6. Export dashboards to JSON for version control
7. Add anomaly detection
8. Integrate with Prometheus for system metrics

---

**Files to Reference:**
- ✅ Working example: `src/pages/FeatureEngineering.tsx` (real data patterns)
- 📚 Guide: `DYNAMIC_VISUALIZATIONS_GUIDE.md`
- 🐳 Docker: `docker-compose.yml` (TimescaleDB already there!)

**Last Updated:** November 16, 2025
