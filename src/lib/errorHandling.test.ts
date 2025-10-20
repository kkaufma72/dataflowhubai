import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleApiError, isNetworkError, isAuthError, getErrorMessage } from '../../lib/errorHandling';

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Mock console.error to prevent test output pollution
    vi.spyOn(console, 'error').mockImplementation(() => {});
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

    it('uses fallback message when no message is provided', () => {
      const error = {};
      const result = handleApiError(error, 'Fallback message');
      
      expect(result.message).toBe('Fallback message');
    });

    it('simplifies network error messages', () => {
      const error = new Error('Failed to fetch');
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
      
      expect(result.message.length).toBeLessThanOrEqual(103); // 100 chars + '...'
      expect(result.message.endsWith('...')).toBe(true);
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
    it('identifies authentication errors', () => {
      expect(isAuthError({ status: 401 })).toBe(true);
      expect(isAuthError({ status: 403 })).toBe(true);
    });

    it('returns false for non-auth errors', () => {
      expect(isAuthError({ status: 404 })).toBe(false);
      expect(isAuthError({ status: 500 })).toBe(false);
      expect(isAuthError({})).toBe(false);
      expect(isAuthError(new Error('Regular error'))).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('extracts message from Error objects', () => {
      expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
    });

    it('extracts message from objects with message property', () => {
      expect(getErrorMessage({ message: 'Object message' })).toBe('Object message');
    });

    it('returns fallback for other types', () => {
      expect(getErrorMessage({})).toBe('An unexpected error occurred');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    });
  });
});