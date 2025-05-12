import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing function calls
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay]);
}

/**
 * Custom hook for throttling function calls
 * @param fn Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const elapsed = now - lastRunRef.current;

    if (elapsed >= limit) {
      lastRunRef.current = now;
      fn(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastRunRef.current = Date.now();
        fn(...args);
      }, limit - elapsed);
    }
  }, [fn, limit]);
}

/**
 * Utility to measure component render time
 * @param componentName Name of the component to measure
 * @returns Object with start and end methods
 */
export const measureRenderTime = (componentName: string) => {
  const start = () => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`Render time for ${componentName}`);
    }
  };

  const end = () => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`Render time for ${componentName}`);
    }
  };

  return { start, end };
};

/**
 * Custom hook to detect slow renders
 * @param componentName Name of the component
 * @param threshold Threshold in milliseconds
 */
export function useDetectSlowRender(componentName: string, threshold = 16) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > threshold && process.env.NODE_ENV === 'development') {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  });
}