/**
 * FRED Data Cache - Improves loading performance
 * 
 * Caches FRED series metadata and popular indicators in localStorage
 * with TTL (time-to-live) for automatic expiration.
 */

const CACHE_PREFIX = 'fred_cache_';
const POPULAR_CACHE_KEY = 'fred_popular_indicators';
const SEARCH_CACHE_PREFIX = 'fred_search_';

// Cache TTL in milliseconds
const CACHE_TTL = {
  series: 24 * 60 * 60 * 1000,      // 24 hours for individual series
  popular: 12 * 60 * 60 * 1000,     // 12 hours for popular indicators
  search: 30 * 60 * 1000,           // 30 minutes for search results
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Check if a cache entry is still valid
 */
function isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * Get cached data
 */
function getFromCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (!isCacheValid(entry)) {
      localStorage.removeItem(key);
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

/**
 * Save data to cache
 */
function saveToCache<T>(key: string, data: T, ttl: number): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn('Cache write error:', error);
    // If storage is full, try to clear old FRED cache entries
    clearOldCacheEntries();
  }
}

/**
 * Clear old FRED cache entries to free up space
 */
function clearOldCacheEntries(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Check all FRED cache keys including popular indicators
    if (key?.startsWith(CACHE_PREFIX) || 
        key?.startsWith(SEARCH_CACHE_PREFIX) || 
        key === POPULAR_CACHE_KEY) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const entry = JSON.parse(raw);
          if (!isCacheValid(entry)) {
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// ============ Public API ============

/**
 * Get cached FRED series by ID
 */
export function getCachedSeries(seriesId: string): any | null {
  return getFromCache(`${CACHE_PREFIX}series_${seriesId}`);
}

/**
 * Cache FRED series data
 */
export function cacheSeries(seriesId: string, data: any): void {
  saveToCache(`${CACHE_PREFIX}series_${seriesId}`, data, CACHE_TTL.series);
}

/**
 * Get cached popular indicators
 */
export function getCachedPopularIndicators(): any[] | null {
  return getFromCache(POPULAR_CACHE_KEY);
}

/**
 * Cache popular indicators
 */
export function cachePopularIndicators(indicators: any[]): void {
  saveToCache(POPULAR_CACHE_KEY, indicators, CACHE_TTL.popular);
}

/**
 * Get cached search results
 */
export function getCachedSearch(query: string): any | null {
  const cacheKey = `${SEARCH_CACHE_PREFIX}${query.toLowerCase().trim()}`;
  return getFromCache(cacheKey);
}

/**
 * Cache search results
 */
export function cacheSearch(query: string, results: any): void {
  const cacheKey = `${SEARCH_CACHE_PREFIX}${query.toLowerCase().trim()}`;
  saveToCache(cacheKey, results, CACHE_TTL.search);
}

/**
 * Clear all FRED cache
 */
export function clearFREDCache(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX) || 
        key?.startsWith(SEARCH_CACHE_PREFIX) || 
        key === POPULAR_CACHE_KEY) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { entries: number; sizeKB: number } {
  let entries = 0;
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX) || 
        key?.startsWith(SEARCH_CACHE_PREFIX) || 
        key === POPULAR_CACHE_KEY) {
      entries++;
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // UTF-16 encoding
      }
    }
  }
  
  return {
    entries,
    sizeKB: Math.round(totalSize / 1024),
  };
}

export default {
  getCachedSeries,
  cacheSeries,
  getCachedPopularIndicators,
  cachePopularIndicators,
  getCachedSearch,
  cacheSearch,
  clearFREDCache,
  getCacheStats,
};
