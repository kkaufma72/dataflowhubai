import { useState, useEffect, useCallback } from 'react';
import { timescaleMetrics, MetricsQueryResult, ModelSummary } from '../lib/timescale';

/**
 * Hook to fetch and auto-refresh metrics for a specific model from TimescaleDB
 */
export const useTimescaleMetrics = (
  modelId?: string,
  refreshInterval: number = 5000,
  hours: number = 24
) => {
  const [metrics, setMetrics] = useState<MetricsQueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!modelId) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await timescaleMetrics.queryModelMetrics(modelId, hours);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch metrics from TimescaleDB');
      }
    } finally {
      setLoading(false);
    }
  }, [modelId, hours]);

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh if refreshInterval is set
    if (refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, refreshInterval]);

  return { 
    metrics, 
    loading, 
    error, 
    refresh: fetchMetrics,
    isAvailable: timescaleMetrics.isAvailable()
  };
};

/**
 * Hook to fetch latest metrics for all models
 */
export const useAllModelsMetrics = (refreshInterval: number = 10000) => {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await timescaleMetrics.queryAllModelsLatest();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch models from TimescaleDB');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchModels, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchModels, refreshInterval]);

  return { 
    models, 
    loading, 
    error, 
    refresh: fetchModels,
    isAvailable: timescaleMetrics.isAvailable()
  };
};

/**
 * Hook to fetch dataset quality trends
 */
export const useDatasetQualityTrend = (
  datasetId?: string,
  refreshInterval: number = 30000,
  hours: number = 168 // 7 days
) => {
  const [trend, setTrend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrend = useCallback(async () => {
    if (!datasetId) {
      setTrend(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await timescaleMetrics.queryDatasetQualityTrend(datasetId, hours);
      setTrend(data);
    } catch (err) {
      console.error('Failed to fetch dataset trend:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch trend from TimescaleDB');
      }
    } finally {
      setLoading(false);
    }
  }, [datasetId, hours]);

  useEffect(() => {
    fetchTrend();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchTrend, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTrend, refreshInterval]);

  return { 
    trend, 
    loading, 
    error, 
    refresh: fetchTrend,
    isAvailable: timescaleMetrics.isAvailable()
  };
};
