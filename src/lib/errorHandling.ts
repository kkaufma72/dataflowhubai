// src/lib/errorHandling.ts

import toast from 'react-hot-toast';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  error: ApiError;
  context?: any;
  userId?: string;
  url?: string;
  stack?: string;
}

const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
  
    if (error?.message) {
      return error.message;
    }
  
    if (error?.error) {
      return getErrorMessage(error.error);
    }
  
    return 'An unexpected error occurred';
  };

/**
 * Handle API errors with user-friendly messages
 */
export const handleApiError = (error: any, overrideMessage?: string): { message: string, status?: number } => {
  console.error('API Error:', error);

  let message: string;
  const originalMessage = getErrorMessage(error);

  if (overrideMessage) {
    message = overrideMessage;
  } else {
    message = originalMessage;
    // Simplify common error messages if no override is present
    const lower = message.toLowerCase();
    if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('etimedout')) {
      message = 'Request timed out. Please try again.';
    } else if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
      message = 'Connection error. Please check your internet connection.';
    }
  }
  
  const status = error?.status;

  // Truncate long messages
  if (message.length > 100) {
    message = `${message.substring(0, 100)}...`;
  }

  if (status === 404 && !message.toLowerCase().includes('not found')) {
    message = 'The requested resource was not found.';
  }

  toast.error(message, {
    duration: 5000,
    position: 'top-right'
  });

  logError({
    error: { message, status },
    timestamp: new Date().toISOString(),
    stack: error?.stack
  });

  return { message, status };
};

/**
 * Handle async errors with loading states
 */
export const handleAsyncError = async <T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    return await promise;
  } catch (error) {
    handleApiError(error, errorMessage);
    return null;
  }
};

/**
 * Retry failed requests with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const backoffDelay = delay * Math.pow(2, i);
        console.log(`Retry attempt ${i + 1} after ${backoffDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw lastError;
};

/**
 * Log errors (extend this to send to error tracking service)
 */
export const logError = (errorLog: Partial<ErrorLog>): void => {
  const log: ErrorLog = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    error: errorLog.error || { message: 'Unknown error' },
    context: errorLog.context,
    userId: errorLog.userId,
    url: typeof window !== 'undefined' ? window.location.href : '',
    stack: errorLog.error?.stack
  };

  if (typeof localStorage !== 'undefined') {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingLogs.push(log);
      const recentLogs = existingLogs.slice(-50);
      localStorage.setItem('errorLogs', JSON.stringify(recentLogs));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  if (import.meta.env.PROD) {
    // sendToErrorTracking(log);
  }
};

/**
 * Get stored error logs
 */
export const getErrorLogs = (): ErrorLog[] => {
  try {
    return JSON.parse(localStorage.getItem('errorLogs') || '[]');
  } catch (e) {
    console.error('Failed to get error logs:', e);
    return [];
  }
};

/**
 * Clear error logs
 */
export const clearErrorLogs = (): void => {
  try {
    localStorage.removeItem('errorLogs');
  } catch (e) {
    console.error('Failed to clear error logs:', e);
  }
};

/**
 * Handle validation errors
 */
export const handleValidationError = (errors: Record<string, string[]>): void => {
  const messages = Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
    .join('\n');

  toast.error(`Validation failed:\n${messages}`, {
    duration: 6000,
    position: 'top-right'
  });
};

export const createErrorBoundaryHandler = (componentName: string) => {
  return (error: Error, errorInfo: any) => {
    console.error(`Error in ${componentName}:`, error, errorInfo);
    logError({
      error: { message: error.message, code: 'COMPONENT_ERROR', details: errorInfo },
      context: componentName,
      stack: error.stack
    });
  };
};

export const isNetworkError = (error: any): boolean => {
    const message = getErrorMessage(error).toLowerCase();
    return message.includes('network') || message.includes('fetch') || message.includes('offline') || message.includes('connection');
};
  
export const isAuthError = (error: any): boolean => {
    return error?.status === 401 || error?.status === 403 || error?.code === 'UNAUTHORIZED';
};

export { getErrorMessage };
