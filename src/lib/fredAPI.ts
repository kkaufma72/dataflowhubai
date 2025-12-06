// FRED API Integration - Federal Reserve Economic Data
// API Documentation: https://fred.stlouisfed.org/docs/api/fred/
// 
// Performance optimizations:
// - Local caching with TTL for series metadata
// - Parallel requests where possible
// - Background pre-fetching of popular indicators

import { supabase } from './supabase';
import {
  getCachedSeries,
  cacheSeries,
  getCachedPopularIndicators,
  cachePopularIndicators,
  getCachedSearch,
  cacheSearch,
} from './fredCache';

const FRED_API_KEY = import.meta.env.VITE_FRED_API_KEY || '';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';
const USE_PROXY = import.meta.env.VITE_USE_FRED_PROXY === 'true'; // Use Supabase Edge Function to bypass CORS
const CORS_PROXY = 'https://corsproxy.io/?'; // Development fallback

// Request timeout (ms)
const REQUEST_TIMEOUT = 15000;

export interface FREDSeries {
  id: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  frequency_short: string;
  units: string;
  units_short: string;
  seasonal_adjustment: string;
  seasonal_adjustment_short: string;
  last_updated: string;
  popularity: number;
  notes?: string;
  group_popularity?: number;
}

export interface FREDObservation {
  realtime_start: string;
  realtime_end: string;
  date: string;
  value: string;
}

export interface FREDSearchResult {
  count: number;
  offset: number;
  limit: number;
  seriess: FREDSeries[];
}

export interface FREDCategory {
  id: number;
  name: string;
  parent_id: number;
}

/**
 * Check if FRED API is configured
 */
export const isFREDConfigured = (): boolean => {
  return !!FRED_API_KEY && FRED_API_KEY.length > 0;
};

/**
 * Fetch with timeout support
 */
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = REQUEST_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Helper function to call FRED API (with proxy support for CORS)
 * Includes timeout handling and better error messages
 */
const callFREDAPI = async (endpoint: string, params: Record<string, any> = {}): Promise<any> => {
  const startTime = Date.now();
  
  if (USE_PROXY) {
    // Use Supabase Edge Function to bypass CORS
    try {
      const { data, error } = await supabase.functions.invoke('fred-proxy', {
        body: { endpoint, params }
      });

      if (error) throw error;
      console.log(`✅ FRED API (Edge Function) ${endpoint} took ${Date.now() - startTime}ms`);
      return data;
    } catch (error) {
      console.warn('Edge Function failed, falling back to CORS proxy:', error);
      // Fall through to CORS proxy fallback
    }
  }
  
  // Use CORS proxy for development
  const url = new URL(`${FRED_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', FRED_API_KEY);
  url.searchParams.append('file_type', 'json');
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url.toString())}`;
  
  try {
    const response = await fetchWithTimeout(proxiedUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FRED API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ FRED API (CORS Proxy) ${endpoint} took ${Date.now() - startTime}ms`);
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
};

/**
 * Search FRED database for series (with caching)
 */
export const searchFREDSeries = async (
  query: string,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: 'search_rank' | 'series_id' | 'title' | 'units' | 'frequency' | 'seasonal_adjustment' | 'realtime_start' | 'realtime_end' | 'last_updated' | 'observation_start' | 'observation_end' | 'popularity' | 'group_popularity';
    sortOrder?: 'asc' | 'desc';
    filterVariable?: string;
    filterValue?: string;
    skipCache?: boolean;
  } = {}
): Promise<FREDSearchResult> => {
  if (!isFREDConfigured()) {
    throw new Error('FRED API key not configured. Please set VITE_FRED_API_KEY in your environment variables.');
  }

  const {
    limit = 25,
    offset = 0,
    orderBy = 'popularity',
    sortOrder = 'desc',
    filterVariable,
    filterValue,
    skipCache = false,
  } = options;

  // Check cache first (only for default pagination)
  if (!skipCache && offset === 0 && !filterVariable) {
    const cached = getCachedSearch(query);
    if (cached) {
      console.log('📦 Using cached search results for:', query);
      return cached;
    }
  }

  const params: Record<string, any> = {
    search_text: query,
    limit: limit.toString(),
    offset: offset.toString(),
    order_by: orderBy,
    sort_order: sortOrder
  };

  if (filterVariable && filterValue) {
    params.filter_variable = filterVariable;
    params.filter_value = filterValue;
  }

  const data = await callFREDAPI('/series/search', params);
  
  // Cache results for future use
  if (offset === 0 && !filterVariable) {
    cacheSearch(query, data);
  }
  
  return data;
};

/**
 * Get series information by ID (with caching)
 */
export const getFREDSeries = async (seriesId: string, skipCache = false): Promise<FREDSeries> => {
  if (!isFREDConfigured()) {
    throw new Error('FRED API key not configured.');
  }

  // Check cache first
  if (!skipCache) {
    const cached = getCachedSeries(seriesId);
    if (cached) {
      console.log('📦 Using cached series data for:', seriesId);
      return cached;
    }
  }

  const data = await callFREDAPI('/series', { series_id: seriesId });
  const series = data.seriess[0];
  
  // Cache for future use
  cacheSeries(seriesId, series);
  
  return series;
};

/**
 * Get observations (data points) for a series
 */
export const getFREDObservations = async (
  seriesId: string,
  options: {
    observationStart?: string; // YYYY-MM-DD
    observationEnd?: string;   // YYYY-MM-DD
    units?: 'lin' | 'chg' | 'ch1' | 'pch' | 'pc1' | 'pca' | 'cch' | 'cca' | 'log';
    frequency?: 'd' | 'w' | 'bw' | 'm' | 'q' | 'sa' | 'a';
    aggregationMethod?: 'avg' | 'sum' | 'eop';
    limit?: number;
  } = {}
): Promise<FREDObservation[]> => {
  if (!isFREDConfigured()) {
    throw new Error('FRED API key not configured.');
  }

  const {
    observationStart,
    observationEnd,
    units = 'lin',
    frequency,
    aggregationMethod = 'avg',
    limit = 100000
  } = options;

  const params: Record<string, any> = {
    series_id: seriesId,
    units,
    aggregation_method: aggregationMethod,
    limit: limit.toString()
  };

  if (observationStart) params.observation_start = observationStart;
  if (observationEnd) params.observation_end = observationEnd;
  if (frequency) params.frequency = frequency;

  const data = await callFREDAPI('/series/observations', params);
  return data.observations;
};

/**
 * Get popular series
 */
export const getPopularFREDSeries = async (limit: number = 10): Promise<FREDSeries[]> => {
  const result = await searchFREDSeries('', {
    limit,
    orderBy: 'popularity',
    sortOrder: 'desc'
  });
  return result.seriess;
};

/**
 * Get categories
 */
export const getFREDCategories = async (categoryId?: number): Promise<FREDCategory[]> => {
  if (!isFREDConfigured()) {
    throw new Error('FRED API key not configured.');
  }

  const params = new URLSearchParams({
    api_key: FRED_API_KEY,
    file_type: 'json'
  });

  if (categoryId) {
    params.append('category_id', categoryId.toString());
  }

  const endpoint = categoryId ? '/category/children' : '/category';
  const response = await fetch(`${FRED_BASE_URL}${endpoint}?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  const data = await response.json();
  return data.categories;
};

/**
 * Get series in a category
 */
export const getFREDCategorySeries = async (
  categoryId: number,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: 'series_id' | 'title' | 'units' | 'frequency' | 'seasonal_adjustment' | 'realtime_start' | 'realtime_end' | 'last_updated' | 'observation_start' | 'observation_end' | 'popularity' | 'group_popularity';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<FREDSeries[]> => {
  if (!isFREDConfigured()) {
    throw new Error('FRED API key not configured.');
  }

  const {
    limit = 25,
    offset = 0,
    orderBy = 'popularity',
    sortOrder = 'desc'
  } = options;

  const params = new URLSearchParams({
    api_key: FRED_API_KEY,
    file_type: 'json',
    category_id: categoryId.toString(),
    limit: limit.toString(),
    offset: offset.toString(),
    order_by: orderBy,
    sort_order: sortOrder
  });

  const response = await fetch(`${FRED_BASE_URL}/category/series?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch category series: ${response.status}`);
  }

  const data = await response.json();
  return data.seriess;
};

/**
 * Convert FRED data to DataFlowHub dataset format
 */
export const convertFREDToDataset = async (
  seriesId: string,
  options: {
    observationStart?: string;
    observationEnd?: string;
    frequency?: 'd' | 'w' | 'bw' | 'm' | 'q' | 'sa' | 'a';
  } = {}
): Promise<{
  name: string;
  description: string;
  data: any[];
  metadata: any;
}> => {
  // Get series info
  const series = await getFREDSeries(seriesId);
  
  // Get observations
  const observations = await getFREDObservations(seriesId, {
    observationStart: options.observationStart,
    observationEnd: options.observationEnd,
    frequency: options.frequency,
    limit: 100000
  });

  // Filter out missing values (FRED uses "." for missing)
  const validObservations = observations.filter(obs => obs.value !== '.');

  // Convert to dataset format
  const data = validObservations.map(obs => ({
    date: obs.date,
    value: parseFloat(obs.value),
    realtime_start: obs.realtime_start,
    realtime_end: obs.realtime_end
  }));

  return {
    name: series.title,
    description: `FRED Series: ${series.id}\n\n${series.notes || ''}\n\nFrequency: ${series.frequency}\nUnits: ${series.units}\nSeasonal Adjustment: ${series.seasonal_adjustment}\nLast Updated: ${series.last_updated}\nObservations: ${data.length} data points from ${series.observation_start} to ${series.observation_end}`,
    data,
    metadata: {
      source: 'FRED',
      fred_series_id: series.id,
      frequency: series.frequency,
      frequency_short: series.frequency_short,
      units: series.units,
      units_short: series.units_short,
      seasonal_adjustment: series.seasonal_adjustment,
      observation_start: series.observation_start,
      observation_end: series.observation_end,
      last_updated: series.last_updated,
      popularity: series.popularity,
      data_points: data.length
    }
  };
};

/**
 * Popular economic indicators
 */
export const POPULAR_ECONOMIC_INDICATORS = [
  { id: 'GDP', name: 'Gross Domestic Product' },
  { id: 'UNRATE', name: 'Unemployment Rate' },
  { id: 'CPIAUCSL', name: 'Consumer Price Index (CPI)' },
  { id: 'FEDFUNDS', name: 'Federal Funds Rate' },
  { id: 'DGS10', name: '10-Year Treasury Rate' },
  { id: 'SP500', name: 'S&P 500' },
  { id: 'DEXUSEU', name: 'USD/EUR Exchange Rate' },
  { id: 'DCOILWTICO', name: 'Crude Oil Prices (WTI)' },
  { id: 'HOUST', name: 'Housing Starts' },
  { id: 'RSXFS', name: 'Retail Sales' },
  { id: 'PAYEMS', name: 'Total Nonfarm Payrolls' },
  { id: 'INDPRO', name: 'Industrial Production Index' },
  { id: 'UMCSENT', name: 'Consumer Sentiment' },
  { id: 'MORTGAGE30US', name: '30-Year Mortgage Rate' },
  { id: 'VIXCLS', name: 'VIX (Volatility Index)' }
];

/**
 * Get popular indicators with caching
 * Returns cached data immediately if available, then fetches fresh data in background
 */
export const getPopularIndicatorsWithCache = async (
  count = 5,
  onProgress?: (loaded: number, total: number) => void
): Promise<FREDSeries[]> => {
  // Check cache first
  const cached = getCachedPopularIndicators();
  if (cached && cached.length >= count) {
    console.log('📦 Using cached popular indicators');
    return cached.slice(0, count);
  }

  // Fetch with progress tracking
  const indicators = POPULAR_ECONOMIC_INDICATORS.slice(0, count);
  const results: FREDSeries[] = [];
  
  for (let i = 0; i < indicators.length; i++) {
    try {
      const series = await getFREDSeries(indicators[i].id);
      results.push(series);
      onProgress?.(i + 1, indicators.length);
    } catch (error) {
      console.warn(`Failed to fetch ${indicators[i].id}:`, error);
    }
  }

  // Cache results
  if (results.length > 0) {
    cachePopularIndicators(results);
  }

  return results;
};

/**
 * Background pre-fetch popular indicators
 * Call this on app mount to warm the cache
 */
export const prefetchPopularIndicators = (): void => {
  if (!isFREDConfigured()) return;
  
  // Check if already cached
  const cached = getCachedPopularIndicators();
  if (cached && cached.length >= 5) {
    console.log('📦 Popular indicators already cached');
    return;
  }

  // Fetch in background (don't await)
  console.log('🔄 Pre-fetching popular indicators in background...');
  getPopularIndicatorsWithCache(5).then(results => {
    console.log(`✅ Pre-fetched ${results.length} popular indicators`);
  }).catch(error => {
    console.warn('Background pre-fetch failed:', error);
  });
};

export default {
  isFREDConfigured,
  searchFREDSeries,
  getFREDSeries,
  getFREDObservations,
  getPopularFREDSeries,
  getFREDCategories,
  getFREDCategorySeries,
  convertFREDToDataset,
  getPopularIndicatorsWithCache,
  prefetchPopularIndicators,
  POPULAR_ECONOMIC_INDICATORS
};

