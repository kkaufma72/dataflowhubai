/**
 * Performance Monitoring Utility
 * Tracks component render times and other performance metrics
 */

interface PerformanceMetric {
  avg: number;
  min: number;
  max: number;
  count: number;
  p95: number;
  p99: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = import.meta.env.DEV;
  }

  /**
   * Mark the start of a performance measurement
   */
  markStart(label: string): void {
    if (!this.enabled) return;
    performance.mark(`${label}-start`);
  }

  /**
   * Mark the end of a performance measurement and record the duration
   */
  markEnd(label: string): void {
    if (!this.enabled) return;
    
    try {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const entries = performance.getEntriesByName(label);
      if (entries.length > 0) {
        const measure = entries[entries.length - 1];
        this.recordMetric(label, measure.duration);
      }
      
      // Clean up marks
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);
    } catch (error) {
      console.warn(`Failed to measure performance for ${label}:`, error);
    }
  }

  /**
   * Record a metric manually (without using marks)
   */
  record(label: string, duration: number): void {
    if (!this.enabled) return;
    this.recordMetric(label, duration);
  }

  /**
   * Internal method to record metrics
   */
  private recordMetric(label: string, duration: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const durations = this.metrics.get(label)!;
    durations.push(duration);
    
    // Keep only last 100 measurements to prevent memory issues
    if (durations.length > 100) {
      durations.shift();
    }
  }

  /**
   * Get metrics for a specific label
   */
  getMetrics(label: string): PerformanceMetric | null {
    const durations = this.metrics.get(label);
    if (!durations || durations.length === 0) return null;

    const sorted = [...durations].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: sorted.length,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Get all recorded metrics
   */
  getAllMetrics(): Record<string, PerformanceMetric | null> {
    const result: Record<string, PerformanceMetric | null> = {};
    this.metrics.forEach((_, label) => {
      result[label] = this.getMetrics(label);
    });
    return result;
  }

  /**
   * Log metrics to console in a table format
   */
  logMetrics(): void {
    if (!this.enabled) return;
    
    const metrics = this.getAllMetrics();
    const formatted: Record<string, any> = {};
    
    Object.entries(metrics).forEach(([label, metric]) => {
      if (metric) {
        formatted[label] = {
          'Avg (ms)': metric.avg.toFixed(2),
          'Min (ms)': metric.min.toFixed(2),
          'Max (ms)': metric.max.toFixed(2),
          'P95 (ms)': metric.p95.toFixed(2),
          'Count': metric.count,
        };
      }
    });
    
    console.table(formatted);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Clear metrics for a specific label
   */
  clearLabel(label: string): void {
    this.metrics.delete(label);
  }

  /**
   * Get a summary of slow operations (> threshold ms)
   */
  getSlowOperations(threshold: number = 1000): Array<{ label: string; avg: number; max: number }> {
    const slow: Array<{ label: string; avg: number; max: number }> = [];
    
    this.metrics.forEach((durations, label) => {
      const metrics = this.getMetrics(label);
      if (metrics && (metrics.avg > threshold || metrics.max > threshold * 2)) {
        slow.push({
          label,
          avg: metrics.avg,
          max: metrics.max,
        });
      }
    });
    
    return slow.sort((a, b) => b.avg - a.avg);
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify(this.getAllMetrics(), null, 2);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper hook for React components
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    performanceMonitor.record(`${componentName}-render`, duration);
  };
};

// Window API for debugging (only in dev)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__performanceMonitor = performanceMonitor;
  console.log('💡 Performance monitor available at: window.__performanceMonitor');
  console.log('💡 Try: window.__performanceMonitor.logMetrics()');
}
