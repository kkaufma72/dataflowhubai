import * as d3 from 'd3';

/**
 * Generate color scales for visualizations
 * @param type Type of color scale
 * @param count Number of colors needed
 * @returns Array of color strings
 */
export const generateColorScale = (
  type: 'categorical' | 'sequential' | 'diverging' = 'categorical',
  count: number = 10
): string[] => {
  switch (type) {
    case 'categorical':
      return d3.schemeCategory10.slice(0, count);
    case 'sequential':
      return d3.quantize(d3.interpolateBlues, count);
    case 'diverging':
      return d3.quantize(d3.interpolateRdBu, count);
    default:
      return d3.schemeCategory10.slice(0, count);
  }
};

/**
 * Format numbers for display in charts
 * @param value Number to format
 * @param format Format type
 * @returns Formatted string
 */
export const formatNumber = (
  value: number,
  format: 'compact' | 'percent' | 'currency' | 'decimal' = 'decimal',
  options?: Intl.NumberFormatOptions
): string => {
  switch (format) {
    case 'compact':
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        ...options
      }).format(value);
    case 'percent':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        ...options
      }).format(value);
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        ...options
      }).format(value);
    case 'decimal':
    default:
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options
      }).format(value);
  }
};

/**
 * Calculate statistics for a dataset
 * @param data Array of numbers
 * @returns Object with statistics
 */
export const calculateStatistics = (data: number[]) => {
  const sortedData = [...data].sort((a, b) => a - b);
  const sum = data.reduce((acc, val) => acc + val, 0);
  const mean = sum / data.length;
  const median = data.length % 2 === 0
    ? (sortedData[data.length / 2 - 1] + sortedData[data.length / 2]) / 2
    : sortedData[Math.floor(data.length / 2)];
  
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  const min = sortedData[0];
  const max = sortedData[sortedData.length - 1];
  
  const q1 = sortedData[Math.floor(data.length * 0.25)];
  const q3 = sortedData[Math.floor(data.length * 0.75)];
  const iqr = q3 - q1;
  
  return {
    count: data.length,
    sum,
    mean,
    median,
    variance,
    stdDev,
    min,
    max,
    q1,
    q3,
    iqr,
    range: max - min
  };
};

/**
 * Detect outliers in a dataset using the IQR method
 * @param data Array of numbers
 * @param multiplier IQR multiplier (default: 1.5)
 * @returns Array of outlier indices
 */
export const detectOutliers = (data: number[], multiplier: number = 1.5): number[] => {
  const stats = calculateStatistics(data);
  const lowerBound = stats.q1 - multiplier * stats.iqr;
  const upperBound = stats.q3 + multiplier * stats.iqr;
  
  return data.reduce<number[]>((outliers, value, index) => {
    if (value < lowerBound || value > upperBound) {
      outliers.push(index);
    }
    return outliers;
  }, []);
};

/**
 * Generate a histogram from data
 * @param data Array of numbers
 * @param bins Number of bins
 * @returns Histogram data
 */
export const generateHistogram = (data: number[], bins: number = 10) => {
  const histogram = d3.histogram()
    .domain([Math.min(...data), Math.max(...data)])
    .thresholds(d3.thresholdScott(data, Math.min(...data), Math.max(...data)))
    .value(d => d)(data);
  
  return histogram.map(bin => ({
    x0: bin.x0,
    x1: bin.x1,
    count: bin.length
  }));
};

/**
 * Generate a correlation matrix from a dataset
 * @param data 2D array of numbers
 * @returns Correlation matrix
 */
export const generateCorrelationMatrix = (data: number[][]) => {
  const numFeatures = data.length;
  const correlationMatrix: number[][] = Array(numFeatures)
    .fill(0)
    .map(() => Array(numFeatures).fill(0));
  
  // Calculate means
  const means = data.map(feature => 
    feature.reduce((sum, val) => sum + val, 0) / feature.length
  );
  
  // Calculate correlation coefficients
  for (let i = 0; i < numFeatures; i++) {
    for (let j = 0; j < numFeatures; j++) {
      if (i === j) {
        correlationMatrix[i][j] = 1; // Correlation with self is 1
        continue;
      }
      
      let numerator = 0;
      let denominator1 = 0;
      let denominator2 = 0;
      
      for (let k = 0; k < data[i].length; k++) {
        const xDiff = data[i][k] - means[i];
        const yDiff = data[j][k] - means[j];
        
        numerator += xDiff * yDiff;
        denominator1 += xDiff * xDiff;
        denominator2 += yDiff * yDiff;
      }
      
      correlationMatrix[i][j] = numerator / Math.sqrt(denominator1 * denominator2);
    }
  }
  
  return correlationMatrix;
};

/**
 * Generate chart configuration for Chart.js
 * @param type Chart type
 * @param data Data for the chart
 * @param options Additional options
 * @returns Chart.js configuration object
 */
export const generateChartConfig = (
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'doughnut',
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }[];
  },
  options: Record<string, any> = {}
) => {
  return {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          display: true
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
        title: {
          display: false,
          text: ''
        }
      },
      scales: {
        x: {
          title: {
            display: false,
            text: ''
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: false,
            text: ''
          }
        }
      },
      ...options
    }
  };
};