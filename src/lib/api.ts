/**
 * API Configuration Utility
 * 
 * Centralizes API base URL configuration for production deployment.
 * 
 * Usage:
 * ```typescript
 * import { getApiUrl } from './lib/api';
 * 
 * const response = await fetch(getApiUrl('/api/modelops/models'));
 * ```
 * 
 * Environment Variables:
 * - VITE_API_BASE_URL: Set to your backend URL in production (e.g., https://api.yourdomain.com)
 *   Leave empty in development (Vite proxy handles it)
 */

/**
 * Get the full API URL for a given path
 * @param path - API path (e.g., '/api/modelops/models')
 * @returns Full API URL
 */
export function getApiUrl(path: string): string {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!baseUrl) return normalizedPath;

  // If baseUrl already includes '/api', avoid generating '/api/api/*'
  const baseEndsWithApi = baseUrl === '/api' || baseUrl.endsWith('/api');
  const pathStartsWithApi = normalizedPath === '/api' || normalizedPath.startsWith('/api/');

  if (baseEndsWithApi && pathStartsWithApi) {
    const withoutApiPrefix = normalizedPath === '/api'
      ? ''
      : normalizedPath.replace(/^\/api\//, '/');
    return `${baseUrl}${withoutApiPrefix}`;
  }

  return `${baseUrl}${normalizedPath}`;
}

/**
 * API base URL constant (for backward compatibility)
 * @deprecated Use getApiUrl() instead for better path handling
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
