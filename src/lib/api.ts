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
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  // Remove leading slash from path if baseUrl is present to avoid double slashes
  if (baseUrl && path.startsWith('/')) {
    return `${baseUrl}${path}`;
  }
  
  return baseUrl ? `${baseUrl}${path}` : path;
}

/**
 * API base URL constant (for backward compatibility)
 * @deprecated Use getApiUrl() instead for better path handling
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
