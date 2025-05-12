import toast from 'react-hot-toast';

export interface ApiError {
  status?: number;
  message: string;
  details?: any;
}

export const handleApiError = (error: unknown, fallbackMessage = 'An unexpected error occurred'): ApiError => {
  console.error('API Error:', error);
  
  let errorMessage = fallbackMessage;
  let errorStatus: number | undefined = undefined;
  let errorDetails: any = undefined;
  
  if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      errorMessage = error.message;
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