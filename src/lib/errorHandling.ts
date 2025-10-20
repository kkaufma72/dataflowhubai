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

/**
 * Handle API errors with user-friendly messages
 */
export const handleApiError = (error: any, context?: string): void => {
  console.error('API Error:', error);

  let message = 'An unexpected error occurred';

  // Handle Supabase errors
  if (error?.message) {
    message = error.message;
  }

  // Handle HTTP errors
  if (error?.status) {
    switch (error.status) {
      case 400:
        message = 'Invalid request. Please check your input.';
        break;
      case 401:
        message = 'Unauthorized. Please sign in again.';
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 409:
        message = 'A conflict occurred. The resource may already exist.';
        break;
      case 429:
        message = 'Too many requests. Please try again later.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      case 503:
        message = 'Service unavailable. Please try again later.';
        break;
    }
  }

  // Handle network errors
  if (error?.name === 'NetworkError' || error?.message?.includes('network')) {
    message = 'Network error. Please check your internet connection.';
  }

  // Add context if provided
  if (context) {
    message = `${context}: ${message}`;
  }

  // Show toast notification
  toast.error(message, {
    duration: 5000,
    position: 'top-right'
  });

  // Log error (in production, send to error tracking service)
  logError({
    error,
    context,
    timestamp: new Date().toISOString()
  });
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
    url: window.location.href,
    stack: errorLog.error?.stack
  };

  // Store in localStorage for debugging (in production, send to error tracking)
  try {
    const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    existingLogs.push(log);
    
    // Keep only last 50 errors
    const recentLogs = existingLogs.slice(-50);
    localStorage.setItem('errorLogs', JSON.stringify(recentLogs));
  } catch (e) {
    console.error('Failed to log error:', e);
  }

  // In production, send to error tracking service like Sentry
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

/**
 * Create error boundary handler
 */
export const createErrorBoundaryHandler = (componentName: string) => {
  return (error: Error, errorInfo: any) => {
    console.error(`Error in ${componentName}:`, error, errorInfo);
    
    logError({
      error: {
        message: error.message,
        code: 'COMPONENT_ERROR',
        details: errorInfo
      },
      context: componentName,
      stack: error.stack
    });

    toast.error(`An error occurred in ${componentName}. Please refresh the page.`, {
      duration: 8000
    });
  };
};

/**
 * Handle permission errors
 */
export const handlePermissionError = (action: string): void => {
  toast.error(`You don't have permission to ${action}. Please contact your administrator.`, {
    duration: 5000
  });
};

/**
 * Handle timeout errors
 */
export const handleTimeoutError = (operation: string): void => {
  toast.error(`${operation} timed out. Please try again.`, {
    duration: 5000
  });
};

/**
 * Wrapper for async operations with error handling
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage?: string
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, errorMessage);
      throw error;
    }
  }) as T;
};

/**
 * Check if error is a specific type
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error?.name === 'NetworkError' ||
    error?.message?.includes('network') ||
    error?.message?.includes('fetch')
  );
};

export const isAuthError = (error: any): boolean => {
  return error?.status === 401 || error?.code === 'UNAUTHORIZED';
};

export const isValidationError = (error: any): boolean => {
  return error?.status === 400 || error?.code === 'VALIDATION_ERROR';
};

export const isNotFoundError = (error: any): boolean => {
  return error?.status === 404 || error?.code === 'NOT_FOUND';
};

/**
 * Format error message for display
 */
export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return formatErrorMessage(error.error);
  }

  return 'An unexpected error occurred';
};

/**
 * Create user-friendly error messages
 */
export const getUserFriendlyMessage = (error: any): string => {
  const technicalMessage = formatErrorMessage(error);

  // Map technical errors to user-friendly messages
  const friendlyMessages: Record<string, string> = {
    'Network request failed': 'Unable to connect to the server. Please check your internet connection.',
    'Failed to fetch': 'Unable to load data. Please try again.',
    'Unauthorized': 'Your session has expired. Please sign in again.',
    'Invalid credentials': 'The email or password you entered is incorrect.',
    'Too many requests': 'You are making too many requests. Please wait a moment and try again.',
    'Internal server error': 'Something went wrong on our end. Our team has been notified.'
  };

  // Check for exact matches
  if (friendlyMessages[technicalMessage]) {
    return friendlyMessages[technicalMessage];
  }

  // Check for partial matches
  for (const [technical, friendly] of Object.entries(friendlyMessages)) {
    if (technicalMessage.toLowerCase().includes(technical.toLowerCase())) {
      return friendly;
    }
  }

  return technicalMessage;
};

/**
 * Report error to monitoring service (placeholder)
 */
export const reportError = (error: any, context?: any): void => {
  // In production, integrate with services like:
  // - Sentry: Sentry.captureException(error, { extra: context });
  // - LogRocket: LogRocket.captureException(error, { extra: context });
  // - Rollbar: Rollbar.error(error, context);
  
  console.error('Error reported:', error, context);
};