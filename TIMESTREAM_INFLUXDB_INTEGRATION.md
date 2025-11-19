z# 🚀 AWS Timestream for InfluxDB Integration

## 🎯 What You Have

You have the **AWS Timestream for InfluxDB MCP Server** container running. This is a Model Context Protocol server that provides time-series database capabilities.

**Container Info:**
- Name: `dfhubtime`
- Image: `mcp/timestream-for-influxdb-mcp-server:latest`
- Status: Exits immediately (expected - needs stdin/stdout connection)
- Type: MCP Server (Model Context Protocol)

## 🔧 Why It's Exiting

MCP servers are designed to run with **stdio transport** - they need an active stdin/stdout connection. They're not meant to run as standalone daemons but as services that communicate via standard input/output.

## 🎭 Two Integration Options

### Option A: Use Regular InfluxDB (Simpler ✅)

Since you already have the infrastructure, use standard InfluxDB instead of the MCP wrapper:

```yaml
# Add to docker-compose.yml
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
      - DOCKER_INFLUXDB_INIT_PASSWORD=dataflow_admin_2025
      - DOCKER_INFLUXDB_INIT_ORG=dataflowhub
      - DOCKER_INFLUXDB_INIT_BUCKET=model_metrics
      - DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=${INFLUXDB_ADMIN_TOKEN:-dataflow-influx-token-2025}
    networks:
      - dataflow_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "influx", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  influxdb_data:
  influxdb_config:
```

### Option B: Use AWS Timestream (Production-Grade 🔥)

If you want to use AWS Timestream for InfluxDB (managed service), configure the MCP server properly.

## 🚀 Recommended: Standard InfluxDB Integration

Let me set this up for you with your existing infrastructure.

### Step 1: Add InfluxDB to Your Stack

```bash
# Stop the MCP container (not needed for direct InfluxDB)
/Applications/Docker.app/Contents/Resources/bin/docker stop dfhubtime
/Applications/Docker.app/Contents/Resources/bin/docker rm dfhubtime

# Update docker-compose.yml (see below)
```

### Step 2: Install InfluxDB Client Library

```bash
cd /Users/kyle/Desktop/design/dataflowhubai
npm install @influxdata/influxdb-client @influxdata/influxdb-client-apis
```

### Step 3: Create InfluxDB Service

```typescript
// src/lib/influxdb.ts
import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';

const url = import.meta.env.VITE_INFLUXDB_URL || 'http://localhost:8086';
const token = import.meta.env.VITE_INFLUXDB_TOKEN || 'dataflow-influx-token-2025';
const org = import.meta.env.VITE_INFLUXDB_ORG || 'dataflowhub';
const bucket = import.meta.env.VITE_INFLUXDB_BUCKET || 'model_metrics';

class InfluxDBService {
  private client: InfluxDB;
  private writeApi: WriteApi;

  constructor() {
    this.client = new InfluxDB({ url, token });
    this.writeApi = this.client.getWriteApi(org, bucket);
    this.writeApi.useDefaultTags({ app: 'dataflowhub' });
  }

  /**
   * Log model training metrics
   */
  async logModelMetrics(data: {
    modelId: string;
    modelName: string;
    accuracy: number;
    loss: number;
    epoch?: number;
    userId?: string;
    datasetId?: string;
  }) {
    const point = new Point('model_metrics')
      .tag('model_id', data.modelId)
      .tag('model_name', data.modelName)
      .tag('user_id', data.userId || 'unknown')
      .floatField('accuracy', data.accuracy)
      .floatField('loss', data.loss)
      .timestamp(new Date());

    if (data.epoch !== undefined) {
      point.intField('epoch', data.epoch);
    }
    if (data.datasetId) {
      point.tag('dataset_id', data.datasetId);
    }

    this.writeApi.writePoint(point);
    await this.writeApi.flush();
  }

  /**
   * Log dataset quality metrics
   */
  async logDatasetQuality(data: {
    datasetId: string;
    datasetName: string;
    qualityScore: number;
    rowCount: number;
    columnCount: number;
    userId?: string;
  }) {
    const point = new Point('dataset_quality')
      .tag('dataset_id', data.datasetId)
      .tag('dataset_name', data.datasetName)
      .tag('user_id', data.userId || 'unknown')
      .floatField('quality_score', data.qualityScore)
      .intField('row_count', data.rowCount)
      .intField('column_count', data.columnCount)
      .timestamp(new Date());

    this.writeApi.writePoint(point);
    await this.writeApi.flush();
  }

  /**
   * Query model metrics over time
   */
  async queryModelMetrics(modelId: string, hours: number = 24) {
    const queryApi = this.client.getQueryApi(org);

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
          console.error('InfluxDB query error:', error);
          reject(error);
        },
        complete() {
          // Transform results
          const timestamps: Date[] = [];
          const accuracies: number[] = [];
          const losses: number[] = [];

          results.forEach(row => {
            if (!timestamps.find(t => t.getTime() === new Date(row._time).getTime())) {
              timestamps.push(new Date(row._time));
            }
            if (row._field === 'accuracy') {
              accuracies.push(row._value);
            } else if (row._field === 'loss') {
              losses.push(row._value);
            }
          });

          resolve({ timestamps, accuracies, losses });
        },
      });
    });
  }

  /**
   * Query all models' latest metrics
   */
  async queryAllModelsLatest() {
    const queryApi = this.client.getQueryApi(org);

    const query = `
      from(bucket: "${bucket}")
        |> range(start: -7d)
        |> filter(fn: (r) => r["_measurement"] == "model_metrics")
        |> filter(fn: (r) => r["_field"] == "accuracy" or r["_field"] == "loss")
        |> last()
    `;

    const results: any[] = [];

    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.push(o);
        },
        error(error) {
          console.error('InfluxDB query error:', error);
          reject(error);
        },
        complete() {
          // Group by model_id
          const models = new Map();
          results.forEach(row => {
            const modelId = row.model_id;
            if (!models.has(modelId)) {
              models.set(modelId, {
                modelId,
                modelName: row.model_name,
                timestamp: new Date(row._time)
              });
            }
            if (row._field === 'accuracy') {
              models.get(modelId).accuracy = row._value;
            } else if (row._field === 'loss') {
              models.get(modelId).loss = row._value;
            }
          });

          resolve(Array.from(models.values()));
        },
      });
    });
  }

  /**
   * Close the connection
   */
  async close() {
    await this.writeApi.close();
  }
}

// Export singleton instance
export const influxdb = new InfluxDBService();
```

### Step 4: React Hook for Real-Time Metrics

```typescript
// src/hooks/useInfluxMetrics.ts
import { useState, useEffect, useCallback } from 'react';
import { influxdb } from '../lib/influxdb';

export const useInfluxMetrics = (modelId?: string, refreshInterval: number = 5000) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!modelId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await influxdb.queryModelMetrics(modelId, 24);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return { metrics, loading, error, refresh: fetchMetrics };
};

export const useAllModelsMetrics = (refreshInterval: number = 10000) => {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      const data = await influxdb.queryAllModelsLatest();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    const interval = setInterval(fetchModels, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchModels, refreshInterval]);

  return { models, loading, refresh: fetchModels };
};
```

### Step 5: Log Metrics During Training

```typescript
// In src/pages/ModelTraining.tsx
import { influxdb } from '../lib/influxdb';
import { useAuth } from '../components/auth/AuthProvider';

const ModelTraining: React.FC = () => {
  const { user } = useAuth();
  
  const handleTrainModel = async () => {
    // ... existing training setup
    
    // Log metrics after each epoch
    const onEpochComplete = async (epoch: number, metrics: any) => {
      try {
        await influxdb.logModelMetrics({
          modelId: newModel.id,
          modelName: newModel.name,
          accuracy: metrics.accuracy,
          loss: metrics.loss,
          epoch: epoch,
          userId: user?.id,
          datasetId: selectedDataset?.id
        });
      } catch (error) {
        console.warn('Failed to log to InfluxDB:', error);
        // Don't fail training if logging fails
      }
    };
    
    // Train with callback
    await trainModelWithCallbacks(config, onEpochComplete);
  };
  
  // ... rest of component
};
```

### Step 6: Create Real-Time Dashboard

```typescript
// src/pages/MetricsDashboard.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { useInfluxMetrics } from '../hooks/useInfluxMetrics';
import { Activity, TrendingUp } from 'lucide-react';

export const MetricsDashboard: React.FC = () => {
  const { metrics, loading, error } = useInfluxMetrics('model-123', 5000);

  if (loading) return <div>Loading metrics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!metrics) return <div>No data available</div>;

  const chartData = {
    labels: metrics.timestamps.map((t: Date) => t.toLocaleTimeString()),
    datasets: [
      {
        label: 'Accuracy',
        data: metrics.accuracies,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
      {
        label: 'Loss',
        data: metrics.losses,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Real-Time Model Metrics</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Activity className="w-4 h-4 animate-pulse text-green-400" />
          <span>Live (5s refresh)</span>
        </div>
      </div>

      <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
        <Line data={chartData} options={{
          responsive: true,
          plugins: {
            legend: {
              labels: { color: '#9ca3af' }
            }
          },
          scales: {
            x: {
              ticks: { color: '#6b7280' },
              grid: { color: 'rgba(75, 85, 99, 0.2)' }
            },
            y: {
              ticks: { color: '#9ca3af' },
              grid: { color: 'rgba(75, 85, 99, 0.2)' }
            }
          }
        }} />
      </div>
    </div>
  );
};
```

### Step 7: Environment Variables

```bash
# Add to .env
VITE_INFLUXDB_URL=http://localhost:8086
VITE_INFLUXDB_TOKEN=dataflow-influx-token-2025
VITE_INFLUXDB_ORG=dataflowhub
VITE_INFLUXDB_BUCKET=model_metrics
```

## 🚀 Quick Start Commands

```bash
# 1. Update docker-compose.yml with InfluxDB service (see above)

# 2. Start InfluxDB
cd /Users/kyle/Desktop/design/dataflowhubai
/Applications/Docker.app/Contents/Resources/bin/docker-compose up -d influxdb

# 3. Install client library
npm install @influxdata/influxdb-client @influxdata/influxdb-client-apis

# 4. Access InfluxDB UI
# Open: http://localhost:8086
# Login: admin / dataflow_admin_2025

# 5. Create bucket via UI or CLI:
/Applications/Docker.app/Contents/Resources/bin/docker exec -it dataflow_influxdb \
  influx bucket create -n model_metrics -o dataflowhub
```

## 📊 What You Get

1. **Real-Time Metrics**: Model accuracy/loss tracked over time
2. **Historical Data**: Query past training runs
3. **Aggregations**: 5-minute averages, hourly rollups
4. **Multi-Model**: Track all models in one place
5. **InfluxDB-Style Visualizations**: Dark theme, live updates
6. **Production-Ready**: Scalable time-series database

## 🎯 Integration with Your Existing Features

### ModelTraining.tsx
Add `onEpochComplete` callback to log metrics during training

### DatasetInsights.tsx
Log dataset quality scores on upload/analysis

### DashboardKoyfin.tsx
Query aggregated metrics from InfluxDB

### FeatureEngineering.tsx
Track feature importance trends over time

## 🐛 Troubleshooting

**Q: Container won't start?**
```bash
# Check if port 8086 is available
lsof -i :8086

# Check Docker logs
/Applications/Docker.app/Contents/Resources/bin/docker logs dataflow_influxdb
```

**Q: Connection refused?**
- Ensure InfluxDB container is running
- Verify URL and token in .env
- Check network: `docker network ls | grep dataflow`

**Q: No data showing?**
- Verify metrics are being written: Check InfluxDB UI → Data Explorer
- Check browser console for errors
- Verify token has write permissions

## 📚 Next Steps

1. ✅ Add InfluxDB to docker-compose.yml
2. ✅ Install client library
3. ✅ Create influxdb.ts service
4. ✅ Add hooks for querying
5. ✅ Log metrics during training
6. ✅ Create dashboard component
7. Add Grafana for advanced visualizations (optional)
8. Set up continuous aggregations for performance
9. Add alerting for accuracy drops
10. Export dashboards to JSON

---

**Status:** Ready to implement
**Recommendation:** Use standard InfluxDB (Option A) - simpler and fully-featured
**Alternative:** If you need AWS Timestream specifically, I can help configure the MCP server properly

