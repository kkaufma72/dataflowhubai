import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import toast from 'react-hot-toast';
import { 
  handleApiError, 
  isNetworkError, 
  isAuthError, 
  getErrorMessage,
  handleAsyncError,
  retryWithBackoff,
  logError,
  getErrorLogs,
  clearErrorLogs,
  handleValidationError,
  createErrorBoundaryHandler 
} from './errorHandling';

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

// Mocking localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    // Clear all mocks and localStorage before each test
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // Mock console.error to prevent test output pollution
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleApiError', () => {
    it('handles Error objects', () => {
      const error = new Error('Test error message');
      const result = handleApiError(error);
      
      expect(result.message).toBe('Test error message');
      expect(result.status).toBeUndefined();
      expect(console.error).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Test error message', expect.any(Object));
    });

    it('handles objects with message property', () => {
      const error = { message: 'API error message' };
      const result = handleApiError(error);
      
      expect(result.message).toBe('API error message');
    });

    it('handles objects with status property', () => {
      const error = { status: 404, message: 'Not found' };
      const result = handleApiError(error);
      
      expect(result.status).toBe(404);
      expect(result.message).toBe('Not found');
    });

    it('uses override message when provided', () => {
      const error = { message: 'Original error' };
      const result = handleApiError(error, 'This should be the message');
      
      expect(result.message).toBe('This should be the message');
    });

    it('simplifies network error messages for "Failed to fetch"', () => {
      const error = new Error('Failed to fetch');
      const result = handleApiError(error);
      
      expect(result.message).toBe('Connection error. Please check your internet connection.');
    });
    
    it('simplifies network error messages for "Network request failed"', () => {
      const error = new Error('Network request failed');
      const result = handleApiError(error);
      
      expect(result.message).toBe('Connection error. Please check your internet connection.');
    });

    it('simplifies timeout error messages', () => {
      const error = new Error('Request timed out after 30000ms');
      const result = handleApiError(error);
      
      expect(result.message).toBe('Request timed out. Please try again.');
    });

    it('truncates very long error messages', () => {
      const longMessage = 'A'.repeat(200);
      const error = new Error(longMessage);
      const result = handleApiError(error);
      
      expect(result.message.length).toBe(103); // 100 chars + '...'
      expect(result.message.endsWith('...')).toBe(true);
    });

    it('provides a specific message for 404 errors', () => {
      const error = { status: 404 };
      const result = handleApiError(error);
      expect(result.message).toBe('The requested resource was not found.');
    });
  });

  describe('handleAsyncError', () => {
    it('returns the result of a successful promise', async () => {
      const promise = Promise.resolve('Success');
      const result = await handleAsyncError(promise);
      expect(result).toBe('Success');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('handles a rejected promise and returns null', async () => {
      const error = new Error('Async error');
      const promise = Promise.reject(error);
      const result = await handleAsyncError(promise, 'Custom error message');
      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Custom error message', expect.any(Object));
    });
  });

  describe('retryWithBackoff', () => {
    it('returns the result of the function on the first try', async () => {
      const fn = vi.fn().mockResolvedValue('Success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('Success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries the function and succeeds', async () => {
      const error = new Error('Failed attempt');
      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('Success');
      
      const result = await retryWithBackoff(fn, 3, 10);
      expect(result).toBe('Success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws the last error after max retries', async () => {
      const error = new Error('Persistent failure');
      const fn = vi.fn().mockRejectedValue(error);
      
      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow(error);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Logging functions', () => {
    it('logError should add an error to localStorage', () => {
      const error = { message: 'Test log' };
      logError({ error });
      
      const logs = JSON.parse(localStorage.getItem('errorLogs') as string);
      expect(logs).toHaveLength(1);
      expect(logs[0].error.message).toBe('Test log');
    });

    it('getErrorLogs should retrieve errors from localStorage', () => {
      const error = { message: 'Another test log' };
      logError({ error });

      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].error.message).toBe('Another test log');
    });

    it('clearErrorLogs should remove errors from localStorage', () => {
      const error = { message: 'Log to be cleared' };
      logError({ error });

      let logs = getErrorLogs();
      expect(logs).toHaveLength(1);

      clearErrorLogs();
      logs = getErrorLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('handleValidationError', () => {
    it('should format and display validation errors', () => {
      const errors = {
        name: ['Name is required', 'Name is too short'],
        email: ['Invalid email format'],
      };
      
      handleValidationError(errors);
      
      const expectedMessage = `Validation failed:
name: Name is required, Name is too short
email: Invalid email format`;
      expect(toast.error).toHaveBeenCalledWith(expectedMessage, expect.any(Object));
    });
  });
  
  describe('createErrorBoundaryHandler', () => {
    it('should return a function that logs component errors', () => {
      const handler = createErrorBoundaryHandler('TestComponent');
      const error = new Error('Component failed to render');
      const errorInfo = { componentStack: '...stack...' };
      
      handler(error, errorInfo);
      
      expect(console.error).toHaveBeenCalledWith('Error in TestComponent:', error, errorInfo);
      
      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].error.message).toBe('Component failed to render');
      expect(logs[0].context).toBe('TestComponent');
    });
  });

  describe('isNetworkError', () => {
    it('identifies network errors', () => {
      expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('Network Error'))).toBe(true);
      expect(isNetworkError(new Error('The Internet connection appears to be offline'))).toBe(true);
    });

    it('returns false for non-network errors', () => {
      expect(isNetworkError(new Error('Regular error'))).toBe(false);
      expect(isNetworkError({})).toBe(false);
      expect(isNetworkError(null)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('identifies authentication errors by status', () => {
      expect(isAuthError({ status: 401 })).toBe(true);
      expect(isAuthError({ status: 403 })).toBe(true);
    });

    it('identifies authentication errors by code', () => {
      expect(isAuthError({ code: 'UNAUTHORIZED' })).toBe(true);
    });

    it('returns false for non-auth errors', () => {
      expect(isAuthError({ status: 404 })).toBe(false);
      expect(isAuthError({ status: 500 })).toBe(false);
      expect(isAuthError({})).toBe(false);
      expect(isAuthError(new Error('Regular error'))).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('extracts message from string', () => {
      expect(getErrorMessage('Just a string error')).toBe('Just a string error');
    });
    
    it('extracts message from Error objects', () => {
      expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
    });

    it('extracts message from objects with message property', () => {
      expect(getErrorMessage({ message: 'Object message' })).toBe('Object message');
    });
    
    it('recursively extracts message from nested error object', () => {
      const error = { error: { message: 'Nested error' } };
      expect(getErrorMessage(error)).toBe('Nested error');
    });

    it('returns fallback for other types', () => {
      expect(getErrorMessage({})).toBe('An unexpected error occurred');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    });
  });
});
