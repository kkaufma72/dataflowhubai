import { InfluxDB, Point, WriteApi, QueryApi } from '@influxdata/influxdb-client';

const url = import.meta.env.VITE_INFLUXDB_URL || 'http://localhost:8086';
const token = import.meta.env.VITE_INFLUXDB_TOKEN || 'dataflow-influx-token-2025';
const org = import.meta.env.VITE_INFLUXDB_ORG || 'dataflowhub';
const bucket = import.meta.env.VITE_INFLUXDB_BUCKET || 'model_metrics';

export interface ModelMetricsData {
  modelId: string;
  modelName: string;
  accuracy: number;
  loss: number;
  epoch?: number;
  userId?: string;
  datasetId?: string;
  precision?: number;
  recall?: number;
  f1Score?: number;
  trainingTime?: number;
}

export interface DatasetQualityData {
  datasetId: string;
  datasetName: string;
  qualityScore: number;
  rowCount: number;
  columnCount: number;
  userId?: string;
  issuesCount?: number;
}

export interface MetricsQueryResult {
  timestamps: Date[];
  accuracies: number[];
  losses: number[];
  epochs?: number[];
}

export interface ModelSummary {
  modelId: string;
  modelName: string;
  timestamp: Date;
  accuracy?: number;
  loss?: number;
  epoch?: number;
}

class InfluxDBService {
  private client: InfluxDB | null = null;
  private writeApi: WriteApi | null = null;
  private queryApi: QueryApi | null = null;
  private isInitialized = false;

  constructor() {
    try {
      this.client = new InfluxDB({ url, token });
      this.writeApi = this.client.getWriteApi(org, bucket);
      this.writeApi.useDefaultTags({ app: 'dataflowhub', environment: 'production' });
      this.queryApi = this.client.getQueryApi(org);
      this.isInitialized = true;
    } catch (error) {
      console.warn('InfluxDB client initialization failed:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if InfluxDB is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Log model training metrics to InfluxDB
   */
  async logModelMetrics(data: ModelMetricsData): Promise<void> {
    if (!this.isAvailable() || !this.writeApi) {
      console.warn('InfluxDB not available, skipping metric logging');
      return;
    }

    try {
      const point = new Point('model_metrics')
        .tag('model_id', data.modelId)
        .tag('model_name', data.modelName)
        .tag('user_id', data.userId || 'unknown')
        .floatField('accuracy', data.accuracy)
        .floatField('loss', data.loss);

      if (data.epoch !== undefined) {
        point.intField('epoch', data.epoch);
      }
      if (data.datasetId) {
        point.tag('dataset_id', data.datasetId);
      }
      if (data.precision !== undefined) {
        point.floatField('precision', data.precision);
      }
      if (data.recall !== undefined) {
        point.floatField('recall', data.recall);
      }
      if (data.f1Score !== undefined) {
        point.floatField('f1_score', data.f1Score);
      }
      if (data.trainingTime !== undefined) {
        point.intField('training_time_ms', data.trainingTime);
      }

      point.timestamp(new Date());

      this.writeApi.writePoint(point);
      await this.writeApi.flush();
      
      console.log('✅ Logged metrics to InfluxDB:', {
        model: data.modelName,
        accuracy: data.accuracy,
        epoch: data.epoch
      });
    } catch (error) {
      console.error('Failed to log model metrics to InfluxDB:', error);
    }
  }

  /**
   * Log dataset quality metrics
   */
  async logDatasetQuality(data: DatasetQualityData): Promise<void> {
    if (!this.isAvailable() || !this.writeApi) {
      console.warn('InfluxDB not available, skipping quality logging');
      return;
    }

    try {
      const point = new Point('dataset_quality')
        .tag('dataset_id', data.datasetId)
        .tag('dataset_name', data.datasetName)
        .tag('user_id', data.userId || 'unknown')
        .floatField('quality_score', data.qualityScore)
        .intField('row_count', data.rowCount)
        .intField('column_count', data.columnCount);

      if (data.issuesCount !== undefined) {
        point.intField('issues_count', data.issuesCount);
      }

      point.timestamp(new Date());

      this.writeApi.writePoint(point);
      await this.writeApi.flush();
      
      console.log('✅ Logged dataset quality to InfluxDB:', {
        dataset: data.datasetName,
        score: data.qualityScore
      });
    } catch (error) {
      console.error('Failed to log dataset quality to InfluxDB:', error);
    }
  }

  /**
   * Query model metrics over time
   */
  async queryModelMetrics(modelId: string, hours: number = 24): Promise<MetricsQueryResult | null> {
    if (!this.isAvailable() || !this.queryApi) {
      console.warn('InfluxDB not available, cannot query metrics');
      return null;
    }

    try {
      const query = `
        from(bucket: "${bucket}")
          |> range(start: -${hours}h)
          |> filter(fn: (r) => r["_measurement"] == "model_metrics")
          |> filter(fn: (r) => r["model_id"] == "${modelId}")
          |> filter(fn: (r) => r["_field"] == "accuracy" or r["_field"] == "loss" or r["_field"] == "epoch")
          |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
          |> yield(name: "mean")
      `;

      const results: any[] = [];

      return new Promise((resolve, reject) => {
        this.queryApi!.queryRows(query, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            results.push(o);
          },
          error(error) {
            console.error('InfluxDB query error:', error);
            reject(error);
          },
          complete() {
            // Transform results into structured data
            const dataMap = new Map<number, { time: Date; accuracy?: number; loss?: number; epoch?: number }>();

            results.forEach(row => {
              const timestamp = new Date(row._time).getTime();
              if (!dataMap.has(timestamp)) {
                dataMap.set(timestamp, { time: new Date(row._time) });
              }
              const data = dataMap.get(timestamp)!;
              
              if (row._field === 'accuracy') {
                data.accuracy = row._value;
              } else if (row._field === 'loss') {
                data.loss = row._value;
              } else if (row._field === 'epoch') {
                data.epoch = row._value;
              }
            });

            const sortedData = Array.from(dataMap.values()).sort((a, b) => a.time.getTime() - b.time.getTime());

            resolve({
              timestamps: sortedData.map(d => d.time),
              accuracies: sortedData.map(d => d.accuracy || 0),
              losses: sortedData.map(d => d.loss || 0),
              epochs: sortedData.map(d => d.epoch).filter((e): e is number => e !== undefined)
            });
          },
        });
      });
    } catch (error) {
      console.error('Failed to query model metrics:', error);
      return null;
    }
  }

  /**
   * Query all models' latest metrics
   */
  async queryAllModelsLatest(): Promise<ModelSummary[]> {
    if (!this.isAvailable() || !this.queryApi) {
      console.warn('InfluxDB not available, cannot query models');
      return [];
    }

    try {
      const query = `
        from(bucket: "${bucket}")
          |> range(start: -7d)
          |> filter(fn: (r) => r["_measurement"] == "model_metrics")
          |> filter(fn: (r) => r["_field"] == "accuracy" or r["_field"] == "loss" or r["_field"] == "epoch")
          |> last()
      `;

      const results: any[] = [];

      return new Promise((resolve, reject) => {
        this.queryApi!.queryRows(query, {
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
            const modelsMap = new Map<string, ModelSummary>();
            
            results.forEach(row => {
              const modelId = row.model_id;
              if (!modelsMap.has(modelId)) {
                modelsMap.set(modelId, {
                  modelId,
                  modelName: row.model_name,
                  timestamp: new Date(row._time)
                });
              }
              
              const model = modelsMap.get(modelId)!;
              if (row._field === 'accuracy') {
                model.accuracy = row._value;
              } else if (row._field === 'loss') {
                model.loss = row._value;
              } else if (row._field === 'epoch') {
                model.epoch = row._value;
              }
            });

            resolve(Array.from(modelsMap.values()));
          },
        });
      });
    } catch (error) {
      console.error('Failed to query all models:', error);
      return [];
    }
  }

  /**
   * Query dataset quality trends
   */
  async queryDatasetQualityTrend(datasetId: string, hours: number = 168): Promise<any> {
    if (!this.isAvailable() || !this.queryApi) {
      console.warn('InfluxDB not available, cannot query dataset quality');
      return null;
    }

    try {
      const query = `
        from(bucket: "${bucket}")
          |> range(start: -${hours}h)
          |> filter(fn: (r) => r["_measurement"] == "dataset_quality")
          |> filter(fn: (r) => r["dataset_id"] == "${datasetId}")
          |> filter(fn: (r) => r["_field"] == "quality_score")
          |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
      `;

      const results: any[] = [];

      return new Promise((resolve, reject) => {
        this.queryApi!.queryRows(query, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            results.push(o);
          },
          error(error) {
            console.error('InfluxDB query error:', error);
            reject(error);
          },
          complete() {
            resolve({
              timestamps: results.map(r => new Date(r._time)),
              qualityScores: results.map(r => r._value)
            });
          },
        });
      });
    } catch (error) {
      console.error('Failed to query dataset quality trend:', error);
      return null;
    }
  }

  /**
   * Close the connection and flush remaining writes
   */
  async close(): Promise<void> {
    if (this.writeApi) {
      try {
        await this.writeApi.close();
      } catch (error) {
        console.error('Error closing InfluxDB connection:', error);
      }
    }
  }
}

// Export singleton instance
export const influxdb = new InfluxDBService();

// Export for testing or manual instantiation
export { InfluxDBService };
