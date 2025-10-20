// src/lib/dataProcessing.ts

export interface ColumnStats {
    name: string;
    type: 'numeric' | 'categorical' | 'datetime' | 'text' | 'boolean';
    count: number;
    missing: number;
    missingPercent: number;
    unique: number;
    uniquePercent: number;
    min?: number | string;
    max?: number | string;
    mean?: number;
    median?: number;
    mode?: any;
    std?: number;
    q1?: number;
    q3?: number;
    topValues?: Array<{ value: any; count: number; percent: number }>;
    distribution?: Array<{ range: string; count: number }>;
  }
  
  export interface DataProfile {
    totalRows: number;
    totalColumns: number;
    memoryUsage: string;
    duplicateRows: number;
    duplicatePercent: number;
    columns: ColumnStats[];
    correlations?: Array<{ col1: string; col2: string; correlation: number }>;
  }
  
  /**
   * Detect column data type
   */
  export const detectColumnType = (values: any[]): ColumnStats['type'] => {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    if (nonNullValues.length === 0) return 'text';
  
    // Check if boolean
    const uniqueValues = [...new Set(nonNullValues.map(v => String(v).toLowerCase()))];
    if (uniqueValues.length <= 2 && uniqueValues.every(v => ['true', 'false', '0', '1', 'yes', 'no'].includes(v))) {
      return 'boolean';
    }
  
    // Check if numeric
    const numericCount = nonNullValues.filter(v => !isNaN(Number(v))).length;
    if (numericCount / nonNullValues.length > 0.8) {
      return 'numeric';
    }
  
    // Check if datetime
    const dateCount = nonNullValues.filter(v => {
      const date = new Date(v);
      return date.toString() !== 'Invalid Date';
    }).length;
    if (dateCount / nonNullValues.length > 0.8) {
      return 'datetime';
    }
  
    return 'categorical';
  };
  
  /**
   * Calculate statistics for a numeric column
   */
  export const calculateNumericStats = (values: number[]): Partial<ColumnStats> => {
    const validValues = values.filter(v => !isNaN(v) && v !== null);
    
    if (validValues.length === 0) {
      return {};
    }
  
    const sorted = [...validValues].sort((a, b) => a - b);
    const sum = validValues.reduce((a, b) => a + b, 0);
    const mean = sum / validValues.length;
    
    const squaredDiffs = validValues.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / validValues.length;
    const std = Math.sqrt(variance);
  
    const q1Index = Math.floor(validValues.length * 0.25);
    const q3Index = Math.floor(validValues.length * 0.75);
    const medianIndex = Math.floor(validValues.length * 0.5);
  
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: Number(mean.toFixed(2)),
      median: sorted[medianIndex],
      std: Number(std.toFixed(2)),
      q1: sorted[q1Index],
      q3: sorted[q3Index]
    };
  };
  
  /**
   * Calculate top values for categorical columns
   */
  export const calculateTopValues = (values: any[], limit: number = 10): Array<{ value: any; count: number; percent: number }> => {
    const valueCounts = new Map<any, number>();
    const total = values.length;
  
    values.forEach(v => {
      const count = valueCounts.get(v) || 0;
      valueCounts.set(v, count + 1);
    });
  
    const sorted = Array.from(valueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, count]) => ({
        value,
        count,
        percent: Number(((count / total) * 100).toFixed(2))
      }));
  
    return sorted;
  };
  
  /**
   * Calculate distribution for numeric columns
   */
  export const calculateDistribution = (values: number[], bins: number = 10): Array<{ range: string; count: number }> => {
    const validValues = values.filter(v => !isNaN(v) && v !== null);
    
    if (validValues.length === 0) return [];
  
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const binSize = (max - min) / bins;
  
    const distribution = Array.from({ length: bins }, (_, i) => {
      const rangeStart = min + (i * binSize);
      const rangeEnd = min + ((i + 1) * binSize);
      const count = validValues.filter(v => v >= rangeStart && v < rangeEnd).length;
      
      return {
        range: `${rangeStart.toFixed(2)} - ${rangeEnd.toFixed(2)}`,
        count
      };
    });
  
    return distribution;
  };
  
  /**
   * Profile a single column
   */
  export const profileColumn = (columnName: string, values: any[]): ColumnStats => {
    const type = detectColumnType(values);
    const count = values.length;
    const missing = values.filter(v => v === null || v === undefined || v === '').length;
    const missingPercent = Number(((missing / count) * 100).toFixed(2));
    const unique = new Set(values.filter(v => v !== null && v !== undefined && v !== '')).size;
    const uniquePercent = Number(((unique / (count - missing)) * 100).toFixed(2));
  
    const stats: ColumnStats = {
      name: columnName,
      type,
      count,
      missing,
      missingPercent,
      unique,
      uniquePercent
    };
  
    if (type === 'numeric') {
      const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
      Object.assign(stats, calculateNumericStats(numericValues));
      stats.distribution = calculateDistribution(numericValues);
    } else if (type === 'categorical' || type === 'boolean') {
      stats.topValues = calculateTopValues(values);
    } else if (type === 'datetime') {
      const dates = values.filter(v => v).map(v => new Date(v).getTime()).filter(v => !isNaN(v));
      if (dates.length > 0) {
        stats.min = new Date(Math.min(...dates)).toISOString();
        stats.max = new Date(Math.max(...dates)).toISOString();
      }
    }
  
    return stats;
  };
  
  /**
   * Profile an entire dataset
   */
  export const profileDataset = (data: { columns: string[]; rows: any[][] }): DataProfile => {
    const { columns, rows } = data;
    const totalRows = rows.length;
    const totalColumns = columns.length;
  
    // Calculate memory usage (rough estimate)
    const memoryBytes = JSON.stringify(data).length;
    const memoryUsage = formatBytes(memoryBytes);
  
    // Find duplicate rows
    const rowStrings = rows.map(row => JSON.stringify(row));
    const uniqueRows = new Set(rowStrings);
    const duplicateRows = totalRows - uniqueRows.size;
    const duplicatePercent = Number(((duplicateRows / totalRows) * 100).toFixed(2));
  
    // Profile each column
    const columnStats: ColumnStats[] = columns.map((colName, colIndex) => {
      const columnValues = rows.map(row => row[colIndex]);
      return profileColumn(colName, columnValues);
    });
  
    // Calculate correlations for numeric columns
    const numericColumns = columnStats.filter(col => col.type === 'numeric');
    const correlations: Array<{ col1: string; col2: string; correlation: number }> = [];
  
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1Values = rows.map(row => Number(row[columns.indexOf(numericColumns[i].name)]));
        const col2Values = rows.map(row => Number(row[columns.indexOf(numericColumns[j].name)]));
        
        const correlation = calculateCorrelation(col1Values, col2Values);
        
        if (!isNaN(correlation) && Math.abs(correlation) > 0.1) {
          correlations.push({
            col1: numericColumns[i].name,
            col2: numericColumns[j].name,
            correlation: Number(correlation.toFixed(3))
          });
        }
      }
    }
  
    return {
      totalRows,
      totalColumns,
      memoryUsage,
      duplicateRows,
      duplicatePercent,
      columns: columnStats,
      correlations: correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 10)
    };
  };
  
  /**
   * Calculate Pearson correlation coefficient
   */
  export const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    
    if (n !== y.length || n === 0) return NaN;
  
    const validPairs = x.map((xi, i) => ({ xi, yi: y[i] }))
      .filter(({ xi, yi }) => !isNaN(xi) && !isNaN(yi));
  
    if (validPairs.length < 2) return NaN;
  
    const xValues = validPairs.map(p => p.xi);
    const yValues = validPairs.map(p => p.yi);
  
    const meanX = xValues.reduce((a, b) => a + b, 0) / xValues.length;
    const meanY = yValues.reduce((a, b) => a + b, 0) / yValues.length;
  
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;
  
    for (let i = 0; i < xValues.length; i++) {
      const xDiff = xValues[i] - meanX;
      const yDiff = yValues[i] - meanY;
      numerator += xDiff * yDiff;
      sumXSquared += xDiff * xDiff;
      sumYSquared += yDiff * yDiff;
    }
  
    const denominator = Math.sqrt(sumXSquared * sumYSquared);
  
    if (denominator === 0) return NaN;
  
    return numerator / denominator;
  };
  
  /**
   * Format bytes to human readable string
   */
  export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
  
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };
  
  /**
   * Detect outliers using IQR method
   */
  export const detectOutliers = (values: number[]): { outliers: number[]; indices: number[] } => {
    const validValues = values.filter(v => !isNaN(v));
    const sorted = [...validValues].sort((a, b) => a - b);
  
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
  
    const lowerBound = q1 - (1.5 * iqr);
    const upperBound = q3 + (1.5 * iqr);
  
    const outliers: number[] = [];
    const indices: number[] = [];
  
    values.forEach((v, i) => {
      if (!isNaN(v) && (v < lowerBound || v > upperBound)) {
        outliers.push(v);
        indices.push(i);
      }
    });
  
    return { outliers, indices };
  };
  
  /**
   * Suggest data types for columns
   */
  export const suggestDataTypes = (data: { columns: string[]; rows: any[][] }): Record<string, string> => {
    const suggestions: Record<string, string> = {};
  
    data.columns.forEach((colName, colIndex) => {
      const values = data.rows.map(row => row[colIndex]);
      const type = detectColumnType(values);
      suggestions[colName] = type;
    });
  
    return suggestions;
  };
  
  /**
   * Generate data profile - alias for profileDataset
   */
  export const generateDataProfile = profileDataset;