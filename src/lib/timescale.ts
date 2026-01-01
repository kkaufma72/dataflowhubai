import { supabase } from './supabase';

const apiBase = import.meta.env.VITE_API_BASE_URL || '';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

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

class TimescaleMetricsService {
  /**
   * Check if metrics endpoint is available.
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Log model training metrics to Timescale via backend API.
   * Uses batched payload to reduce request overhead.
   */
  async logModelMetrics(data: ModelMetricsData): Promise<void> {
    const metrics: Record<string, number> = {
      accuracy: data.accuracy,
      loss: data.loss,
    };

    if (data.epoch !== undefined) metrics.epoch = data.epoch;
    if (data.precision !== undefined) metrics.precision = data.precision;
    if (data.recall !== undefined) metrics.recall = data.recall;
    if (data.f1Score !== undefined) metrics.f1_score = data.f1Score;
    if (data.trainingTime !== undefined) metrics.training_time_ms = data.trainingTime;

    const authHeaders = await getAuthHeaders();
    await fetch(`${apiBase}/api/monitoring/metrics/${data.modelId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(metrics),
    });
  }

  /**
   * Log dataset quality metrics.
   * For now, store as generic model metrics using dataset_ prefix to reuse the same endpoint.
   */
  async logDatasetQuality(data: DatasetQualityData): Promise<void> {
    const metrics: Record<string, number> = {
      quality_score: data.qualityScore,
      row_count: data.rowCount,
      column_count: data.columnCount,
    };
    if (data.issuesCount !== undefined) metrics.issues_count = data.issuesCount;

    const authHeaders = await getAuthHeaders();
    await fetch(`${apiBase}/api/monitoring/metrics/${data.datasetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(metrics),
    });
  }

  /**
   * Query model metrics over time from Timescale.
   */
  async queryModelMetrics(modelId: string, hours: number = 24): Promise<MetricsQueryResult | null> {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
    const url = new URL(`${apiBase}/api/monitoring/metrics/${modelId}`, origin);
    url.searchParams.set('start_time', start.toISOString());
    url.searchParams.set('end_time', end.toISOString());
    url.searchParams.set('limit', '5000');

    const authHeaders = await getAuthHeaders();
    const response = await fetch(url.toString(), { headers: authHeaders });
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }
    const rows: Array<{ time: string; metric_name: string; metric_value: number }> = await response.json();

    const dataMap = new Map<number, { time: Date; accuracy?: number; loss?: number; epoch?: number }>();
    rows.forEach((row) => {
      const timestamp = new Date(row.time).getTime();
      if (!dataMap.has(timestamp)) {
        dataMap.set(timestamp, { time: new Date(row.time) });
      }
      const data = dataMap.get(timestamp)!;
      if (row.metric_name === 'accuracy') data.accuracy = Number(row.metric_value);
      if (row.metric_name === 'loss') data.loss = Number(row.metric_value);
      if (row.metric_name === 'epoch') data.epoch = Number(row.metric_value);
    });

    const sorted = Array.from(dataMap.values()).sort((a, b) => a.time.getTime() - b.time.getTime());
    return {
      timestamps: sorted.map((d) => d.time),
      accuracies: sorted.map((d) => d.accuracy || 0),
      losses: sorted.map((d) => d.loss || 0),
      epochs: sorted.map((d) => d.epoch).filter((e): e is number => e !== undefined),
    };
  }

  /**
   * Query all models' latest metrics by pulling recent records.
   * This is a lightweight heuristic until a dedicated API exists.
   */
  async queryAllModelsLatest(): Promise<ModelSummary[]> {
    // No dedicated endpoint yet; return empty to avoid stale Influx usage.
    return [];
  }

  /**
   * Query dataset quality trends (stub until dedicated endpoint exists).
   */
  async queryDatasetQualityTrend(): Promise<any> {
    return null;
  }
}

export const timescaleMetrics = new TimescaleMetricsService();
export { TimescaleMetricsService };
