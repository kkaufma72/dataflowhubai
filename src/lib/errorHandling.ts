import toast from 'react-hot-toast';

export interface ApiError {
  status?: number;
  message: string;
  details?: any;
}

export const handleApiError = (error: unknown, fallbackMessage = 'An unexpected error occurred'): ApiError => {
  console.error('API Error:', error);
  
  // Keep error messages concise and user-friendly
  let errorMessage = fallbackMessage;
  let errorStatus: number | undefined = undefined;
  let errorDetails: any = undefined;
  
  if (error instanceof Error) {
    // Simplify error messages for better UX
    errorMessage = simplifyErrorMessage(error.message);
  }
  
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      errorMessage = simplifyErrorMessage(error.message);
    }
    
    if ('status' in error && typeof error.status === 'number') {
      errorStatus = error.status;
    }
    
    if ('details' in error) {
      errorDetails = error.details;
    }
  }
  
  // Show toast notification for the error
  toast.error(errorMessage);
  
  return {
    status: errorStatus,
    message: errorMessage,
    details: errorDetails
  };
};

// Helper function to simplify error messages
const simplifyErrorMessage = (message: string): string => {
  // Remove technical details and keep only user-friendly parts
  if (message.includes('Failed to fetch')) {
    return 'Connection error. Please check your internet connection.';
  }
  
  if (message.includes('NetworkError')) {
    return 'Network error. Please try again later.';
  }
  
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (message.length > 100) {
    // Truncate very long messages
    return message.substring(0, 100) + '...';
  }
  
  return message;
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('Network Error') ||
      error.message.includes('The Internet connection appears to be offline')
    );
  }
  return false;
};

export const isAuthError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'status' in error) {
    return error.status === 401 || error.status === 403;
  }
  return false;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};