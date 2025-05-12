/**
 * Utility functions for data processing and transformation
 */

/**
 * Data profiling types
 */
export interface DataProfile {
  rowCount: number;
  columnProfiles: Record<string, ColumnProfile>;
  correlations?: Record<string, Record<string, number>>;
  dataQualityIssues: DataQualityIssue[];
  recommendations: PreprocessingRecommendation[];
}

export interface ColumnProfile {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text' | 'boolean' | 'unknown';
  count: number;
  missing: number;
  missingPercent: number;
  unique: number;
  uniquePercent: number;
  stats: {
    min?: number | string;
    max?: number | string;
    mean?: number;
    median?: number;
    mode?: any;
    std?: number;
    q1?: number;
    q3?: number;
    iqr?: number;
    skewness?: number;
    kurtosis?: number;
    histogram?: {bin: number | string; count: number}[];
  };
  distribution?: Record<string, number>;
  outliers?: number;
  outlierIndices?: number[];
}

export interface DataQualityIssue {
  type: 'missing_values' | 'outliers' | 'imbalance' | 'high_cardinality' | 'skewed_distribution' | 'duplicate_rows';
  severity: 'low' | 'medium' | 'high';
  column?: string;
  description: string;
  affectedRows?: number;
  recommendation?: string;
}

export interface PreprocessingRecommendation {
  type: 'missing_values' | 'outliers' | 'encoding' | 'scaling' | 'feature_selection' | 'dimensionality_reduction';
  column?: string;
  description: string;
  suggestedMethod: string;
  impact: 'low' | 'medium' | 'high';
}

export interface PreprocessingOptions {
  missingValues?: {
    strategy: 'drop_rows' | 'drop_columns' | 'impute_mean' | 'impute_median' | 'impute_mode' | 'impute_constant';
    columns?: string[];
    threshold?: number;
    constantValue?: any;
  };
  outliers?: {
    strategy: 'remove' | 'cap' | 'replace_mean' | 'replace_median';
    method: 'z_score' | 'iqr' | 'isolation_forest';
    threshold?: number;
    columns?: string[];
  };
  encoding?: {
    strategy: 'one_hot' | 'label' | 'target' | 'frequency' | 'binary';
    columns?: string[];
    handleUnknown?: 'error' | 'ignore' | 'infrequent';
  };
  scaling?: {
    strategy: 'min_max' | 'standard' | 'robust' | 'max_abs' | 'normalizer';
    columns?: string[];
  };
  featureSelection?: {
    strategy: 'variance' | 'k_best' | 'rfe' | 'tree_importance' | 'correlation';
    threshold?: number;
    k?: number;
  };
  dimensionalityReduction?: {
    strategy: 'pca' | 'tsne' | 'umap';
    components?: number;
  };
  batchSize?: number;
  storeIntermediateResults?: boolean;
}

export interface PreprocessingResult {
  data: any[][];
  columns: string[];
  profile: DataProfile;
  transformations: {
    type: string;
    params: Record<string, any>;
    affectedColumns: string[];
    affectedRows: number;
    timestamp: string;
  }[];
  version: string;
  originalDatasetId: string;
}

/**
 * Check if a value is numeric
 * @param value Value to check
 * @returns Whether the value is numeric
 */
export const isNumeric = (value: any): boolean => {
  if (typeof value === 'number') return true;
  if (typeof value !== 'string') return false;
  return !isNaN(parseFloat(value)) && isFinite(Number(value));
};

/**
 * Check if a value is a valid date
 * @param value Value to check
 * @returns Whether the value is a valid date
 */
export const isDate = (value: any): boolean => {
  if (value instanceof Date) return !isNaN(value.getTime());
  if (typeof value !== 'string') return false;
  
  // Try to parse the date
  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * Check if a column is categorical based on its values
 * @param values Array of values
 * @param threshold Maximum ratio of unique values to total values
 * @returns Whether the column is categorical
 */
export const isCategorical = (values: any[], threshold: number = 0.2): boolean => {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return false;
  
  const uniqueValues = new Set(nonNullValues);
  return uniqueValues.size <= Math.min(10, nonNullValues.length * threshold);
};

/**
 * Check if a column is boolean based on its values
 * @param values Array of values
 * @returns Whether the column is boolean
 */
export const isBoolean = (values: any[]): boolean => {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return false;
  
  const uniqueValues = new Set(nonNullValues.map(v => 
    typeof v === 'string' ? v.toLowerCase() : v
  ));
  
  // Check if all values are boolean-like
  const booleanLike = ['true', 'false', true, false, 1, 0, 'yes', 'no', 'y', 'n'];
  return uniqueValues.size <= 2 && 
         [...uniqueValues].every(v => booleanLike.includes(v));
}

/**
 * Infer column types from data
 * @param columns Column names
 * @param rows Data rows
 * @returns Object with column types
 */
export const inferColumnTypes = (columns: string[], rows: any[][]): Record<string, string> => {
  const columnTypes: Record<string, string> = {};
  
  columns.forEach((column, colIndex) => {
    const values = rows.map(row => row[colIndex]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    if (nonNullValues.length === 0) {
      columnTypes[column] = 'unknown';
      return;
    }
    
    const numericCount = nonNullValues.filter(isNumeric).length;
    const dateCount = nonNullValues.filter(isDate).length;
    const booleanCheck = isBoolean(nonNullValues);
    
    if (booleanCheck) {
      columnTypes[column] = 'boolean';
    } else 
    
    if (numericCount / nonNullValues.length > 0.8) {
      columnTypes[column] = 'numeric';
    } else if (dateCount / nonNullValues.length > 0.8) {
      columnTypes[column] = 'datetime';
    } else if (isCategorical(nonNullValues)) {
      columnTypes[column] = 'categorical';
    } else {
      columnTypes[column] = 'text';
    }
  });
  
  return columnTypes;
};

/**
 * Calculate summary statistics for a column
 * @param values Column values
 * @param columnType Column type
 * @returns Summary statistics
 */
export const calculateColumnStats = (values: any[], columnType: string): Record<string, any> => {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) {
    return { count: 0, missing: values.length };
  }
  
  const stats: Record<string, any> = {
    count: nonNullValues.length,
    missing: values.length - nonNullValues.length,
    missingPercent: ((values.length - nonNullValues.length) / values.length) * 100
  };
  
  if (columnType === 'numeric') {
    const numericValues = nonNullValues.map(v => Number(v));
    const sortedValues = [...numericValues].sort((a, b) => a - b);
    
    stats.min = Math.min(...numericValues);
    stats.max = Math.max(...numericValues);
    stats.mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
    stats.median = sortedValues[Math.floor(sortedValues.length / 2)];
    
    // Calculate standard deviation
    const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - stats.mean, 2), 0) / numericValues.length;
    stats.std = Math.sqrt(variance);
    
    // Calculate quartiles
    stats.q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
    stats.q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
    stats.iqr = stats.q3 - stats.q1;
    
    // Calculate skewness
    const cubedDifferences = numericValues.map(val => Math.pow(val - stats.mean, 3));
    const sumCubedDiffs = cubedDifferences.reduce((sum, val) => sum + val, 0);
    stats.skewness = sumCubedDiffs / (numericValues.length * Math.pow(stats.std, 3));
    
    // Calculate kurtosis
    const fourthPowerDifferences = numericValues.map(val => Math.pow(val - stats.mean, 4));
    const sumFourthPowerDiffs = fourthPowerDifferences.reduce((sum, val) => sum + val, 0);
    stats.kurtosis = sumFourthPowerDiffs / (numericValues.length * Math.pow(stats.std, 4)) - 3;
    
    // Generate histogram
    const binCount = Math.min(10, Math.ceil(Math.sqrt(numericValues.length)));
    const binWidth = (stats.max - stats.min) / binCount;
    const histogram = Array(binCount).fill(0);
    
    numericValues.forEach(val => {
      const binIndex = Math.min(Math.floor((val - stats.min) / binWidth), binCount - 1);
      histogram[binIndex]++;
    });
    
    stats.histogram = histogram.map((count, i) => ({
      bin: stats.min + i * binWidth,
      count
    }));
    
    // Detect outliers using IQR method
    const lowerBound = stats.q1 - 1.5 * stats.iqr;
    const upperBound = stats.q3 + 1.5 * stats.iqr;
    stats.outliers = numericValues.filter(val => val < lowerBound || val > upperBound).length;
    stats.outlierIndices = numericValues.map((val, idx) => 
      val < lowerBound || val > upperBound ? idx : -1
    ).filter(idx => idx !== -1);
  } else if (columnType === 'categorical' || columnType === 'text') {
    // Calculate frequency distribution
    const valueCounts: Record<string, number> = {};
    nonNullValues.forEach(val => {
      const strVal = String(val);
      valueCounts[strVal] = (valueCounts[strVal] || 0) + 1;
    });
    
    // Sort by frequency
    const sortedCounts = Object.entries(valueCounts)
      .sort(([, countA], [, countB]) => countB - countA);
    
    stats.uniqueCount = Object.keys(valueCounts).length;
    stats.uniquePercent = (stats.uniqueCount / nonNullValues.length) * 100;
    stats.mostCommon = sortedCounts.slice(0, 5).map(([value, count]) => ({
      value,
      count,
      percent: (count / nonNullValues.length) * 100
    }));
    stats.leastCommon = sortedCounts.slice(-5).map(([value, count]) => ({
      value,
      count,
      percent: (count / nonNullValues.length) * 100
    }));
    
    // Calculate distribution
    stats.distribution = Object.fromEntries(
      sortedCounts.map(([value, count]) => [value, count / nonNullValues.length])
    );
    
    // Check for high cardinality
    stats.highCardinality = stats.uniqueCount > 100 || stats.uniquePercent > 90;
  } else if (columnType === 'datetime') {
    const dates = nonNullValues.map(v => new Date(v));
    const timestamps = dates.map(d => d.getTime());
    
    stats.min = new Date(Math.min(...timestamps)).toISOString();
    stats.max = new Date(Math.max(...timestamps)).toISOString();
    stats.range = Math.max(...timestamps) - Math.min(...timestamps);
    stats.rangeDays = stats.range / (1000 * 60 * 60 * 24);
    
    // Calculate temporal distribution
    const years: Record<number, number> = {};
    const months: Record<number, number> = {};
    const daysOfWeek: Record<number, number> = {};
    
    dates.forEach(date => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const dayOfWeek = date.getDay();
      
      years[year] = (years[year] || 0) + 1;
      months[month] = (months[month] || 0) + 1;
      daysOfWeek[dayOfWeek] = (daysOfWeek[dayOfWeek] || 0) + 1;
    });
    
    stats.yearDistribution = years;
    stats.monthDistribution = months;
    stats.dayOfWeekDistribution = daysOfWeek;
  } else if (columnType === 'boolean') {
    const booleanValues = nonNullValues.map(v => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v !== 0;
      if (typeof v === 'string') {
        const lowerVal = v.toLowerCase();
        return lowerVal === 'true' || lowerVal === 'yes' || lowerVal === 'y' || lowerVal === '1';
      }
      return Boolean(v);
    });
    
    const trueCount = booleanValues.filter(v => v).length;
    const falseCount = booleanValues.filter(v => !v).length;
    
    stats.trueCount = trueCount;
    stats.falseCount = falseCount;
    stats.truePercent = (trueCount / booleanValues.length) * 100;
    stats.falsePercent = (falseCount / booleanValues.length) * 100;
    stats.mode = trueCount > falseCount ? true : false;
  }
  
  return stats;
};

/**
 * Generate a comprehensive data profile for a dataset
 * @param data 2D array of data
 * @param columns Column names
 * @returns Data profile with statistics and recommendations
 */
export const generateDataProfile = (data: any[][], columns: string[]): DataProfile => {
  // Infer column types
  const columnTypes = inferColumnTypes(columns, data);
  
  // Calculate column profiles
  const columnProfiles: Record<string, ColumnProfile> = {};
  columns.forEach((column, colIndex) => {
    const values = data.map(row => row[colIndex]);
    const stats = calculateColumnStats(values, columnTypes[column]);
    
    columnProfiles[column] = {
      name: column,
      type: columnTypes[column] as any,
      count: stats.count,
      missing: stats.missing,
      missingPercent: stats.missingPercent,
      unique: stats.uniqueCount || 0,
      uniquePercent: stats.uniquePercent || 0,
      stats: {
        min: stats.min,
        max: stats.max,
        mean: stats.mean,
        median: stats.median,
        mode: stats.mode,
        std: stats.std,
        q1: stats.q1,
        q3: stats.q3,
        iqr: stats.iqr,
        skewness: stats.skewness,
        kurtosis: stats.kurtosis,
        histogram: stats.histogram
      },
      distribution: stats.distribution || stats.yearDistribution || 
                   (stats.trueCount ? { 'true': stats.truePercent / 100, 'false': stats.falsePercent / 100 } : undefined),
      outliers: stats.outliers,
      outlierIndices: stats.outlierIndices
    };
  });
  
  // Calculate correlations for numeric columns
  const numericColumns = columns.filter(col => columnTypes[col] === 'numeric');
  const correlations: Record<string, Record<string, number>> = {};
  
  if (numericColumns.length > 1) {
    numericColumns.forEach(col1 => {
      correlations[col1] = {};
      
      numericColumns.forEach(col2 => {
        if (col1 === col2) {
          correlations[col1][col2] = 1;
          return;
        }
        
        const col1Index = columns.indexOf(col1);
        const col2Index = columns.indexOf(col2);
        
        const values1 = data.map(row => Number(row[col1Index])).filter(v => !isNaN(v));
        const values2 = data.map(row => Number(row[col2Index])).filter(v => !isNaN(v));
        
        // Calculate Pearson correlation
        const n = Math.min(values1.length, values2.length);
        if (n === 0) {
          correlations[col1][col2] = 0;
          return;
        }
        
        const mean1 = values1.reduce((sum, val) => sum + val, 0) / n;
        const mean2 = values2.reduce((sum, val) => sum + val, 0) / n;
        
        let num = 0;
        let denom1 = 0;
        let denom2 = 0;
        
        for (let i = 0; i < n; i++) {
          const diff1 = values1[i] - mean1;
          const diff2 = values2[i] - mean2;
          
          num += diff1 * diff2;
          denom1 += diff1 * diff1;
          denom2 += diff2 * diff2;
        }
        
        const correlation = denom1 === 0 || denom2 === 0 ? 0 : num / Math.sqrt(denom1 * denom2);
        correlations[col1][col2] = correlation;
      });
    });
  }
  
  // Identify data quality issues
  const dataQualityIssues: DataQualityIssue[] = [];
  
  // Check for missing values
  columns.forEach(column => {
    const profile = columnProfiles[column];
    if (profile.missingPercent > 5) {
      dataQualityIssues.push({
        type: 'missing_values',
        severity: profile.missingPercent > 20 ? 'high' : profile.missingPercent > 10 ? 'medium' : 'low',
        column,
        description: `Column "${column}" has ${profile.missingPercent.toFixed(1)}% missing values`,
        affectedRows: profile.missing,
        recommendation: profile.missingPercent > 50 
          ? 'Consider dropping this column' 
          : `Impute missing values using ${profile.type === 'numeric' ? 'mean/median' : 'mode'}`
      });
    }
  });
  
  // Check for outliers in numeric columns
  numericColumns.forEach(column => {
    const profile = columnProfiles[column];
    if (profile.outliers && profile.outliers > 0) {
      const outlierPercent = (profile.outliers / profile.count) * 100;
      if (outlierPercent > 1) {
        dataQualityIssues.push({
          type: 'outliers',
          severity: outlierPercent > 10 ? 'high' : outlierPercent > 5 ? 'medium' : 'low',
          column,
          description: `Column "${column}" has ${outlierPercent.toFixed(1)}% outliers`,
          affectedRows: profile.outliers,
          recommendation: outlierPercent > 10 
            ? 'Consider capping or removing outliers' 
            : 'Consider using robust scaling or transformations'
        });
      }
    }
  });
  
  // Check for class imbalance in categorical columns
  columns.forEach(column => {
    const profile = columnProfiles[column];
    if ((profile.type === 'categorical' || profile.type === 'boolean') && profile.distribution) {
      const values = Object.values(profile.distribution);
      if (values.length > 1) {
        const maxFreq = Math.max(...values);
        const minFreq = Math.min(...values);
        
        if (maxFreq / minFreq > 10) {
          dataQualityIssues.push({
            type: 'imbalance',
            severity: maxFreq / minFreq > 100 ? 'high' : maxFreq / minFreq > 50 ? 'medium' : 'low',
            column,
            description: `Column "${column}" has severe class imbalance (${(maxFreq * 100).toFixed(1)}% vs ${(minFreq * 100).toFixed(1)}%)`,
            recommendation: 'Consider resampling techniques or weighted models'
          });
        }
      }
    }
  });
  
  // Check for high cardinality
  columns.forEach(column => {
    const profile = columnProfiles[column];
    if (profile.type === 'categorical' && profile.highCardinality) {
      dataQualityIssues.push({
        type: 'high_cardinality',
        severity: profile.uniqueCount > 1000 ? 'high' : profile.uniqueCount > 100 ? 'medium' : 'low',
        column,
        description: `Column "${column}" has high cardinality (${profile.uniqueCount} unique values)`,
        recommendation: 'Consider grouping less frequent categories or using embedding techniques'
      });
    }
  });
  
  // Check for skewed distributions
  numericColumns.forEach(column => {
    const profile = columnProfiles[column];
    if (profile.stats.skewness && Math.abs(profile.stats.skewness) > 1) {
      dataQualityIssues.push({
        type: 'skewed_distribution',
        severity: Math.abs(profile.stats.skewness) > 3 ? 'high' : Math.abs(profile.stats.skewness) > 2 ? 'medium' : 'low',
        column,
        description: `Column "${column}" has a ${profile.stats.skewness > 0 ? 'right' : 'left'}-skewed distribution (skewness: ${profile.stats.skewness.toFixed(2)})`,
        recommendation: profile.stats.skewness > 0 ? 'Consider log transformation' : 'Consider power transformation'
      });
    }
  });
  
  // Check for duplicate rows
  const rowSignatures = new Set<string>();
  let duplicateCount = 0;
  
  data.forEach(row => {
    const signature = JSON.stringify(row);
    if (rowSignatures.has(signature)) {
      duplicateCount++;
    } else {
      rowSignatures.add(signature);
    }
  });
  
  if (duplicateCount > 0) {
    const duplicatePercent = (duplicateCount / data.length) * 100;
    dataQualityIssues.push({
      type: 'duplicate_rows',
      severity: duplicatePercent > 10 ? 'high' : duplicatePercent > 5 ? 'medium' : 'low',
      description: `Dataset contains ${duplicateCount} duplicate rows (${duplicatePercent.toFixed(1)}%)`,
      affectedRows: duplicateCount,
      recommendation: 'Consider removing duplicate rows'
    });
  }
  
  // Generate preprocessing recommendations
  const recommendations: PreprocessingRecommendation[] = [];
  
  // Recommendations for missing values
  columns.forEach(column => {
    const profile = columnProfiles[column];
    if (profile.missingPercent > 0) {
      if (profile.missingPercent > 50) {
        recommendations.push({
          type: 'missing_values',
          column,
          description: `High percentage of missing values in "${column}"`,
          suggestedMethod: 'drop_column',
          impact: 'high'
        });
      } else if (profile.type === 'numeric') {
        // For numeric columns, recommend imputation based on distribution
        const method = Math.abs(profile.stats.skewness || 0) > 1 ? 'impute_median' : 'impute_mean';
        recommendations.push({
          type: 'missing_values',
          column,
          description: `Missing values in numeric column "${column}"`,
          suggestedMethod: method,
          impact: profile.missingPercent > 20 ? 'high' : profile.missingPercent > 5 ? 'medium' : 'low'
        });
      } else if (profile.type === 'categorical' || profile.type === 'boolean') {
        recommendations.push({
          type: 'missing_values',
          column,
          description: `Missing values in categorical column "${column}"`,
          suggestedMethod: 'impute_mode',
          impact: profile.missingPercent > 20 ? 'high' : profile.missingPercent > 5 ? 'medium' : 'low'
        });
      }
    }
  });
  
  // Recommendations for outliers
  numericColumns.forEach(column => {
    const profile = columnProfiles[column];
    if (profile.outliers && profile.outliers > 0) {
      const outlierPercent = (profile.outliers / profile.count) * 100;
      if (outlierPercent > 1) {
        recommendations.push({
          type: 'outliers',
          column,
          description: `Outliers detected in "${column}"`,
          suggestedMethod: outlierPercent > 5 ? 'cap_outliers' : 'robust_scaling',
          impact: outlierPercent > 10 ? 'high' : outlierPercent > 5 ? 'medium' : 'low'
        });
      }
    }
  });
  
  // Recommendations for encoding
  columns.forEach(column => {
    const profile = columnProfiles[column];
    if (profile.type === 'categorical') {
      if (profile.uniqueCount <= 2) {
        recommendations.push({
          type: 'encoding',
          column,
          description: `Binary categorical column "${column}"`,
          suggestedMethod: 'label_encoding',
          impact: 'medium'
        });
      } else if (profile.uniqueCount <= 15) {
        recommendations.push({
          type: 'encoding',
          column,
          description: `Categorical column "${column}" with ${profile.uniqueCount} categories`,
          suggestedMethod: 'one_hot_encoding',
          impact: 'medium'
        });
      } else {
        recommendations.push({
          type: 'encoding',
          column,
          description: `High-cardinality categorical column "${column}" with ${profile.uniqueCount} categories`,
          suggestedMethod: 'target_encoding',
          impact: 'high'
        });
      }
    }
  });
  
  // Recommendations for scaling
  numericColumns.forEach(column => {
    const profile = columnProfiles[column];
    if (profile.stats.skewness && Math.abs(profile.stats.skewness) > 1) {
      recommendations.push({
        type: 'scaling',
        column,
        description: `Skewed numeric column "${column}"`,
        suggestedMethod: profile.stats.skewness > 0 ? 'log_transform' : 'power_transform',
        impact: 'medium'
      });
    } else if (profile.outliers && profile.outliers > 0) {
      recommendations.push({
        type: 'scaling',
        column,
        description: `Numeric column "${column}" with outliers`,
        suggestedMethod: 'robust_scaling',
        impact: 'medium'
      });
    } else {
      recommendations.push({
        type: 'scaling',
        column,
        description: `Numeric column "${column}"`,
        suggestedMethod: 'standard_scaling',
        impact: 'medium'
      });
    }
  });
  
  // Feature selection recommendations
  if (numericColumns.length > 10) {
    // Check for highly correlated features
    const highlyCorrelatedPairs: [string, string, number][] = [];
    
    Object.entries(correlations).forEach(([col1, correlationsForCol1]) => {
      Object.entries(correlationsForCol1).forEach(([col2, correlation]) => {
        if (col1 !== col2 && Math.abs(correlation) > 0.9) {
          highlyCorrelatedPairs.push([col1, col2, correlation]);
        }
      });
    });
    
    if (highlyCorrelatedPairs.length > 0) {
      recommendations.push({
        type: 'feature_selection',
        description: `${highlyCorrelatedPairs.length} pairs of highly correlated features detected`,
        suggestedMethod: 'correlation_filter',
        impact: 'high'
      });
    }
    
    // Recommend dimensionality reduction for datasets with many features
    if (numericColumns.length > 20) {
      recommendations.push({
        type: 'dimensionality_reduction',
        description: `Large number of numeric features (${numericColumns.length})`,
        suggestedMethod: 'pca',
        impact: 'medium'
      });
    }
  }
  
  return {
    rowCount: data.length,
    columnProfiles,
    correlations,
    dataQualityIssues,
    recommendations
  };
};

/**
 * Handle missing values in a dataset
 * @param data 2D array of data
 * @param columns Column names
 * @param strategy Strategy for handling missing values
 * @param columnTypes Column types
 * @returns Processed data with missing values handled
 */
export const handleMissingValues = (
  data: any[][],
  columns: string[],
  strategy: 'drop_rows' | 'drop_columns' | 'impute_mean' | 'impute_median' | 'impute_mode' | 'impute_constant',
  columnTypes: Record<string, string>,
  constantValue: any = 0
): { 
  data: any[][];
  columns: string[];
  affectedRows: number;
  affectedColumns: string[];
} => {
  let processedData = [...data];
  let processedColumns = [...columns];
  let affectedRows = 0;
  let affectedColumns: string[] = [];
  
  if (strategy === 'drop_rows') {
    // Drop rows with any missing values
    const originalLength = processedData.length;
    processedData = processedData.filter(row => 
      row.every(cell => cell !== null && cell !== undefined && cell !== '')
    );
    affectedRows = originalLength - processedData.length;
  } else if (strategy === 'drop_columns') {
    // Identify columns with missing values
    const columnsToKeep: number[] = [];
    columns.forEach((col, colIndex) => {
      const hasMissing = data.some(row => 
        row[colIndex] === null || row[colIndex] === undefined || row[colIndex] === ''
      );
      
      if (!hasMissing) {
        columnsToKeep.push(colIndex);
      } else {
        affectedColumns.push(col);
      }
    });
    
    // Keep only columns without missing values
    processedData = processedData.map(row => 
      columnsToKeep.map(colIndex => row[colIndex])
    );
    processedColumns = columnsToKeep.map(colIndex => columns[colIndex]);
  } else {
    // Imputation strategies
    columns.forEach((col, colIndex) => {
      const columnType = columnTypes[col];
      const values = data.map(row => row[colIndex]);
      const hasMissing = values.some(v => v === null || v === undefined || v === '');
      
      if (!hasMissing) return;
      
      affectedColumns.push(col);
      
      if (columnType === 'numeric' && (strategy === 'impute_mean' || strategy === 'impute_median')) {
        // Calculate mean or median for numeric columns
        const numericValues = values
          .filter(v => v !== null && v !== undefined && v !== '')
          .map(v => Number(v));
        
        let imputeValue;
        if (strategy === 'impute_mean') {
          imputeValue = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        } else {
          const sorted = [...numericValues].sort((a, b) => a - b);
          imputeValue = sorted[Math.floor(sorted.length / 2)];
        }
        
        // Impute missing values
        processedData.forEach((row, rowIndex) => {
          if (row[colIndex] === null || row[colIndex] === undefined || row[colIndex] === '') {
            row[colIndex] = imputeValue;
            affectedRows++;
          }
        });
      } else if (strategy === 'impute_mode') {
        // Calculate mode (most frequent value)
        const valueCounts: Record<string, number> = {};
        values
          .filter(v => v !== null && v !== undefined && v !== '')
          .forEach(v => {
            const strVal = String(v);
            valueCounts[strVal] = (valueCounts[strVal] || 0) + 1;
          });
        
        let mode = '';
        let maxCount = 0;
        Object.entries(valueCounts).forEach(([value, count]) => {
          if (count > maxCount) {
            maxCount = count;
            mode = value;
          }
        });
        
        // Impute missing values
        processedData.forEach((row, rowIndex) => {
          if (row[colIndex] === null || row[colIndex] === undefined || row[colIndex] === '') {
            row[colIndex] = mode;
            affectedRows++;
          }
        });
      } else if (strategy === 'impute_constant') {
        // Impute with constant value
        processedData.forEach((row, rowIndex) => {
          if (row[colIndex] === null || row[colIndex] === undefined || row[colIndex] === '') {
            row[colIndex] = constantValue;
            affectedRows++;
          }
        });
      }
    });
  }
  
  return {
    data: processedData,
    columns: processedColumns,
    affectedRows,
    affectedColumns
  };
};

/**
 * Normalize numeric columns in a dataset
 * @param data 2D array of data
 * @param columns Column names
 * @param columnTypes Column types
 * @param method Normalization method
 * @returns Normalized data
 */
export const normalizeData = (
  data: any[][],
  columns: string[],
  columnTypes: Record<string, string>,
  method: 'min_max' | 'z_score' | 'robust' = 'min_max'
): {
  data: any[][];
  stats: Record<string, { min?: number; max?: number; mean?: number; std?: number; median?: number; q1?: number; q3?: number; }>;
} => {
  const processedData = [...data.map(row => [...row])];
  const stats: Record<string, any> = {};
  
  columns.forEach((col, colIndex) => {
    if (columnTypes[col] !== 'numeric') return;
    
    const values = data.map(row => row[colIndex])
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => Number(v));
    
    if (values.length === 0) return;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    // Calculate quartiles for robust scaling
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    
    stats[col] = { min, max, mean, std, median, q1, q3 };
    
    // Apply normalization
    processedData.forEach((row, rowIndex) => {
      const value = row[colIndex];
      if (value === null || value === undefined || value === '') return;
      
      const numValue = Number(value);
      
      if (method === 'min_max') {
        // Min-max scaling to [0, 1]
        row[colIndex] = (numValue - min) / (max - min);
      } else if (method === 'z_score') {
        // Z-score normalization
        row[colIndex] = (numValue - mean) / std;
      } else if (method === 'robust') {
        // Robust scaling using median and IQR
        row[colIndex] = (numValue - median) / (q3 - q1);
      }
    });
  });
  
  return { data: processedData, stats };
};

/**
 * Encode categorical columns in a dataset
 * @param data 2D array of data
 * @param columns Column names
 * @param columnTypes Column types
 * @param method Encoding method
 * @returns Encoded data and updated columns
 */
export const encodeCategoricalFeatures = (
  data: any[][],
  columns: string[],
  columnTypes: Record<string, string>,
  method: 'one_hot' | 'label' | 'frequency' = 'one_hot'
): {
  data: any[][];
  columns: string[];
  encodingMaps: Record<string, Record<string, number>>;
} => {
  let processedData = [...data.map(row => [...row])];
  let processedColumns = [...columns];
  const encodingMaps: Record<string, Record<string, number>> = {};
  
  if (method === 'one_hot') {
    // One-hot encoding
    columns.forEach((col, colIndex) => {
      if (columnTypes[col] !== 'categorical') return;
      
      const values = data.map(row => row[colIndex])
        .filter(v => v !== null && v !== undefined && v !== '');
      
      const uniqueValues = [...new Set(values)];
      
      // Create new columns for each unique value
      uniqueValues.forEach((value, i) => {
        const newColName = `${col}_${value}`;
        processedColumns.push(newColName);
        
        // Add new column to data
        processedData.forEach((row, rowIndex) => {
          row.push(row[colIndex] === value ? 1 : 0);
        });
      });
      
      // Store encoding map
      encodingMaps[col] = uniqueValues.reduce((map, value, i) => {
        map[value] = i;
        return map;
      }, {} as Record<string, number>);
    });
  } else if (method === 'label') {
    // Label encoding
    columns.forEach((col, colIndex) => {
      if (columnTypes[col] !== 'categorical') return;
      
      const values = data.map(row => row[colIndex])
        .filter(v => v !== null && v !== undefined && v !== '');
      
      const uniqueValues = [...new Set(values)];
      
      // Create encoding map
      const encodingMap: Record<string, number> = {};
      uniqueValues.forEach((value, i) => {
        encodingMap[value] = i;
      });
      
      // Apply encoding
      processedData.forEach((row, rowIndex) => {
        const value = row[colIndex];
        if (value !== null && value !== undefined && value !== '') {
          row[colIndex] = encodingMap[value];
        }
      });
      
      // Store encoding map
      encodingMaps[col] = encodingMap;
    });
  } else if (method === 'frequency') {
    // Frequency encoding
    columns.forEach((col, colIndex) => {
      if (columnTypes[col] !== 'categorical') return;
      
      const values = data.map(row => row[colIndex])
        .filter(v => v !== null && v !== undefined && v !== '');
      
      // Calculate frequency of each value
      const valueCounts: Record<string, number> = {};
      values.forEach(value => {
        valueCounts[value] = (valueCounts[value] || 0) + 1;
      });
      
      // Create encoding map (frequency ratio)
      const encodingMap: Record<string, number> = {};
      Object.entries(valueCounts).forEach(([value, count]) => {
        encodingMap[value] = count / values.length;
      });
      
      // Apply encoding
      processedData.forEach((row, rowIndex) => {
        const value = row[colIndex];
        if (value !== null && value !== undefined && value !== '') {
          row[colIndex] = encodingMap[value];
        }
      });
      
      // Store encoding map
      encodingMaps[col] = encodingMap;
    });
  }
  
  return { data: processedData, columns: processedColumns, encodingMaps };
};

/**
 * Handle outliers in a dataset
 * @param data 2D array of data
 * @param columns Column names
 * @param columnTypes Column types
 * @param method Method for detecting outliers
 * @param strategy Strategy for handling outliers
 * @param threshold Threshold for outlier detection
 * @returns Processed data with outliers handled
 */
export const handleOutliers = (
  data: any[][],
  columns: string[],
  columnTypes: Record<string, string>,
  method: 'z_score' | 'iqr' | 'isolation_forest' = 'iqr',
  strategy: 'remove' | 'cap' | 'replace_mean' | 'replace_median' = 'cap',
  threshold: number = 3
): {
  data: any[][];
  affectedRows: number;
  affectedColumns: string[];
  outlierIndices: Record<string, number[]>;
} => {
  let processedData = [...data.map(row => [...row])];
  let affectedRows = 0;
  const affectedColumns: string[] = [];
  const outlierIndices: Record<string, number[]> = {};
  
  // Process only numeric columns
  columns.forEach((col, colIndex) => {
    if (columnTypes[col] !== 'numeric') return;
    
    const values = data.map(row => row[colIndex])
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => Number(v));
    
    if (values.length === 0) return;
    
    // Calculate statistics
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    
    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    // Detect outliers
    const colOutlierIndices: number[] = [];
    
    data.forEach((row, rowIndex) => {
      const value = row[colIndex];
      if (value === null || value === undefined || value === '') return;
      
      const numValue = Number(value);
      let isOutlier = false;
      
      if (method === 'z_score') {
        // Z-score method
        const zScore = Math.abs((numValue - mean) / std);
        isOutlier = zScore > threshold;
      } else if (method === 'iqr') {
        // IQR method
        const lowerBound = q1 - threshold * iqr;
        const upperBound = q3 + threshold * iqr;
        isOutlier = numValue < lowerBound || numValue > upperBound;
      } else if (method === 'isolation_forest') {
        // Simplified isolation forest (just a placeholder)
        // In a real implementation, this would use a proper algorithm
        const zScore = Math.abs((numValue - mean) / std);
        isOutlier = zScore > threshold * 1.5;
      }
      
      if (isOutlier) {
        colOutlierIndices.push(rowIndex);
        
        // Handle outlier based on strategy
        if (strategy === 'remove') {
          // Mark for removal (set to null for now, will be filtered later)
          processedData[rowIndex][colIndex] = null;
        } else if (strategy === 'cap') {
          // Cap the value
          if (method === 'z_score') {
            const direction = numValue > mean ? 1 : -1;
            processedData[rowIndex][colIndex] = mean + direction * threshold * std;
          } else {
            const lowerBound = q1 - threshold * iqr;
            const upperBound = q3 + threshold * iqr;
            if (numValue < lowerBound) {
              processedData[rowIndex][colIndex] = lowerBound;
            } else if (numValue > upperBound) {
              processedData[rowIndex][colIndex] = upperBound;
            }
          }
        } else if (strategy === 'replace_mean') {
          // Replace with mean
          processedData[rowIndex][colIndex] = mean;
        } else if (strategy === 'replace_median') {
          // Replace with median
          processedData[rowIndex][colIndex] = median;
        }
      }
    });
    
    if (colOutlierIndices.length > 0) {
      affectedColumns.push(col);
      outlierIndices[col] = colOutlierIndices;
    }
  });
  
  // If strategy is 'remove', filter out rows with null values
  if (strategy === 'remove') {
    const originalLength = processedData.length;
    processedData = processedData.filter(row => !row.includes(null));
    affectedRows = originalLength - processedData.length;
  } else {
    // Count affected rows for other strategies
    affectedRows = Object.values(outlierIndices).reduce((sum, indices) => sum + indices.length, 0);
  }
  
  return {
    data: processedData,
    affectedRows,
    affectedColumns,
    outlierIndices
  };
};

/**
 * Apply feature scaling to numeric columns
 * @param data 2D array of data
 * @param columns Column names
 * @param columnTypes Column types
 * @param method Scaling method
 * @param selectedColumns Columns to scale (default: all numeric)
 * @returns Scaled data and scaling parameters
 */
export const applyFeatureScaling = (
  data: any[][],
  columns: string[],
  columnTypes: Record<string, string>,
  method: 'min_max' | 'standard' | 'robust' | 'max_abs' | 'normalizer' = 'standard',
  selectedColumns?: string[]
): {
  data: any[][];
  scalingParams: Record<string, Record<string, number>>;
  affectedColumns: string[];
} => {
  const processedData = [...data.map(row => [...row])];
  const scalingParams: Record<string, Record<string, number>> = {};
  const affectedColumns: string[] = [];
  
  // Determine which columns to process
  const columnsToProcess = selectedColumns || 
    columns.filter(col => columnTypes[col] === 'numeric');
  
  columnsToProcess.forEach(col => {
    const colIndex = columns.indexOf(col);
    if (colIndex === -1 || columnTypes[col] !== 'numeric') return;
    
    const values = data.map(row => row[colIndex])
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => Number(v));
    
    if (values.length === 0) return;
    
    // Calculate statistics
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    // Calculate quartiles for robust scaling
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    
    // Store scaling parameters
    scalingParams[col] = { min, max, mean, std, median, q1, q3 };
    affectedColumns.push(col);
    
    // Apply scaling
    processedData.forEach((row, rowIndex) => {
      const value = row[colIndex];
      if (value === null || value === undefined || value === '') return;
      
      const numValue = Number(value);
      
      if (method === 'min_max') {
        // Min-max scaling to [0, 1]
        row[colIndex] = range === 0 ? 0 : (numValue - min) / range;
      } else if (method === 'standard') {
        // Standardization (z-score)
        row[colIndex] = std === 0 ? 0 : (numValue - mean) / std;
      } else if (method === 'robust') {
        // Robust scaling using median and IQR
        row[colIndex] = iqr === 0 ? 0 : (numValue - median) / iqr;
      } else if (method === 'max_abs') {
        // Max absolute scaling
        row[colIndex] = max === 0 ? 0 : numValue / max;
      } else if (method === 'normalizer') {
        // Will be handled separately as it operates on rows, not columns
        // This is just a placeholder
        row[colIndex] = numValue;
      }
    });
  });
  
  // Handle normalizer separately if selected
  if (method === 'normalizer') {
    processedData.forEach((row, rowIndex) => {
      // Calculate L2 norm (Euclidean norm)
      let sumSquares = 0;
      columnsToProcess.forEach(col => {
        const colIndex = columns.indexOf(col);
        if (colIndex === -1) return;
        
        const value = row[colIndex];
        if (value === null || value === undefined || value === '') return;
        
        const numValue = Number(value);
        sumSquares += numValue * numValue;
      });
      
      const norm = Math.sqrt(sumSquares);
      
      // Normalize row
      if (norm > 0) {
        columnsToProcess.forEach(col => {
          const colIndex = columns.indexOf(col);
          if (colIndex === -1) return;
          
          const value = row[colIndex];
          if (value === null || value === undefined || value === '') return;
          
          const numValue = Number(value);
          row[colIndex] = numValue / norm;
        });
      }
    });
  }
  
  return {
    data: processedData,
    scalingParams,
    affectedColumns
  };
};

/**
 * Apply feature selection to reduce dimensionality
 * @param data 2D array of data
 * @param columns Column names
 * @param columnTypes Column types
 * @param method Feature selection method
 * @param params Additional parameters for the method
 * @returns Selected features and reduced data
 */
export const applyFeatureSelection = (
  data: any[][],
  columns: string[],
  columnTypes: Record<string, string>,
  method: 'variance' | 'k_best' | 'correlation' | 'tree_importance' = 'variance',
  params: {
    threshold?: number;
    k?: number;
    targetColumn?: string;
  } = {}
): {
  selectedFeatures: string[];
  data: any[][];
  columns: string[];
  scores: Record<string, number>;
} => {
  // Default parameters
  const threshold = params.threshold || 0.01;
  const k = params.k || Math.max(5, Math.floor(columns.length / 2));
  const targetColumn = params.targetColumn;
  
  // Get numeric columns
  const numericColumns = columns.filter(col => columnTypes[col] === 'numeric');
  
  // Calculate feature scores
  const scores: Record<string, number> = {};
  
  if (method === 'variance') {
    // Variance threshold method
    numericColumns.forEach(col => {
      const colIndex = columns.indexOf(col);
      
      const values = data.map(row => row[colIndex])
        .filter(v => v !== null && v !== undefined && v !== '')
        .map(v => Number(v));
      
      if (values.length === 0) {
        scores[col] = 0;
        return;
      }
      
      // Calculate mean
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Calculate variance
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      
      scores[col] = variance;
    });
  } else if (method === 'correlation' && targetColumn) {
    // Correlation with target
    const targetIndex = columns.indexOf(targetColumn);
    if (targetIndex === -1) {
      throw new Error(`Target column "${targetColumn}" not found`);
    }
    
    const targetValues = data.map(row => row[targetIndex])
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => Number(v));
    
    if (targetValues.length === 0) {
      throw new Error(`Target column "${targetColumn}" has no valid values`);
    }
    
    const targetMean = targetValues.reduce((sum, val) => sum + val, 0) / targetValues.length;
    
    numericColumns.forEach(col => {
      if (col === targetColumn) {
        scores[col] = 1; // Perfect correlation with itself
        return;
      }
      
      const colIndex = columns.indexOf(col);
      
      const colValues = data.map(row => row[colIndex])
        .filter(v => v !== null && v !== undefined && v !== '')
        .map(v => Number(v));
      
      if (colValues.length === 0) {
        scores[col] = 0;
        return;
      }
      
      const colMean = colValues.reduce((sum, val) => sum + val, 0) / colValues.length;
      
      // Calculate Pearson correlation
      let numerator = 0;
      let denominator1 = 0;
      let denominator2 = 0;
      
      const n = Math.min(targetValues.length, colValues.length);
      
      for (let i = 0; i < n; i++) {
        const targetDiff = targetValues[i] - targetMean;
        const colDiff = colValues[i] - colMean;
        
        numerator += targetDiff * colDiff;
        denominator1 += targetDiff * targetDiff;
        denominator2 += colDiff * colDiff;
      }
      
      const correlation = denominator1 === 0 || denominator2 === 0 
        ? 0 
        : numerator / Math.sqrt(denominator1 * denominator2);
      
      // Use absolute correlation as score
      scores[col] = Math.abs(correlation);
    });
  } else if (method === 'k_best') {
    // Simplified k-best method (using variance as a proxy)
    numericColumns.forEach(col => {
      const colIndex = columns.indexOf(col);
      
      const values = data.map(row => row[colIndex])
        .filter(v => v !== null && v !== undefined && v !== '')
        .map(v => Number(v));
      
      if (values.length === 0) {
        scores[col] = 0;
        return;
      }
      
      // Calculate mean
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Calculate variance
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      
      scores[col] = variance;
    });
  } else if (method === 'tree_importance') {
    // Simplified tree importance (random scores for demonstration)
    numericColumns.forEach(col => {
      // In a real implementation, this would use a tree-based model
      // For now, we'll just use random scores
      scores[col] = Math.random();
    });
  }
  
  // Select features based on method
  let selectedFeatures: string[] = [];
  
  if (method === 'variance') {
    // Select features with variance above threshold
    selectedFeatures = Object.entries(scores)
      .filter(([, score]) => score > threshold)
      .map(([col]) => col);
  } else if (method === 'correlation' || method === 'tree_importance') {
    // Select features with highest absolute correlation
    selectedFeatures = Object.entries(scores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, k)
      .map(([col]) => col);
  } else if (method === 'k_best') {
    // Select k features with highest scores
    selectedFeatures = Object.entries(scores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, k)
      .map(([col]) => col);
  }
  
  // Add non-numeric columns that weren't considered
  const nonNumericColumns = columns.filter(col => columnTypes[col] !== 'numeric');
  selectedFeatures = [...selectedFeatures, ...nonNumericColumns];
  
  // Create reduced dataset
  const selectedIndices = selectedFeatures.map(col => columns.indexOf(col));
  const reducedData = data.map(row => selectedIndices.map(idx => row[idx]));
  const reducedColumns = selectedFeatures;
  
  return {
    selectedFeatures,
    data: reducedData,
    columns: reducedColumns,
    scores
  };
};

/**
 * Apply a complete preprocessing pipeline to a dataset
 * @param data 2D array of data
 * @param columns Column names
 * @param options Preprocessing options
 * @returns Preprocessed data and metadata
 */
export const applyPreprocessingPipeline = (
  data: any[][],
  columns: string[],
  options: PreprocessingOptions
): PreprocessingResult => {
  // Clone data to avoid modifying the original
  let processedData = [...data.map(row => [...row])];
  let processedColumns = [...columns];
  
  // Generate initial data profile
  const columnTypes = inferColumnTypes(columns, data);
  const initialProfile = generateDataProfile(data, columns);
  
  // Track transformations
  const transformations: {
    type: string;
    params: Record<string, any>;
    affectedColumns: string[];
    affectedRows: number;
    timestamp: string;
  }[] = [];
  
  // Handle missing values
  if (options.missingValues) {
    const { strategy, columns: selectedColumns, threshold, constantValue } = options.missingValues;
    
    // Filter columns if specified
    const columnsToProcess = selectedColumns || processedColumns;
    
    const result = handleMissingValues(
      processedData,
      processedColumns,
      strategy,
      columnTypes,
      constantValue
    );
    
    processedData = result.data;
    processedColumns = result.columns;
    
    transformations.push({
      type: 'missing_values',
      params: {
        strategy,
        threshold,
        constantValue
      },
      affectedColumns: result.affectedColumns,
      affectedRows: result.affectedRows,
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle outliers
  if (options.outliers) {
    const { strategy, method, threshold, columns: selectedColumns } = options.outliers;
    
    const result = handleOutliers(
      processedData,
      processedColumns,
      columnTypes,
      method,
      strategy,
      threshold
    );
    
    processedData = result.data;
    
    transformations.push({
      type: 'outliers',
      params: {
        strategy,
        method,
        threshold
      },
      affectedColumns: result.affectedColumns,
      affectedRows: result.affectedRows,
      timestamp: new Date().toISOString()
    });
  }
  
  // Apply encoding
  if (options.encoding) {
    const { strategy, columns: selectedColumns, handleUnknown } = options.encoding;
    
    const result = encodeCategoricalFeatures(
      processedData,
      processedColumns,
      columnTypes,
      strategy as any
    );
    
    processedData = result.data;
    processedColumns = result.columns;
    
    transformations.push({
      type: 'encoding',
      params: {
        strategy,
        handleUnknown
      },
      affectedColumns: Object.keys(result.encodingMaps),
      affectedRows: processedData.length,
      timestamp: new Date().toISOString()
    });
  }
  
  // Apply scaling
  if (options.scaling) {
    const { strategy, columns: selectedColumns } = options.scaling;
    
    const result = applyFeatureScaling(
      processedData,
      processedColumns,
      columnTypes,
      strategy as any,
      selectedColumns
    );
    
    processedData = result.data;
    
    transformations.push({
      type: 'scaling',
      params: {
        strategy,
        scalingParams: result.scalingParams
      },
      affectedColumns: result.affectedColumns,
      affectedRows: processedData.length,
      timestamp: new Date().toISOString()
    });
  }
  
  // Apply feature selection
  if (options.featureSelection) {
    const { strategy, threshold, k } = options.featureSelection;
    
    const result = applyFeatureSelection(
      processedData,
      processedColumns,
      columnTypes,
      strategy as any,
      { threshold, k }
    );
    
    processedData = result.data;
    processedColumns = result.columns;
    
    transformations.push({
      type: 'feature_selection',
      params: {
        strategy,
        threshold,
        k,
        scores: result.scores
      },
      affectedColumns: columns.filter(col => !result.selectedFeatures.includes(col)),
      affectedRows: processedData.length,
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate final data profile
  const finalProfile = generateDataProfile(processedData, processedColumns);
  
  return {
    data: processedData,
    columns: processedColumns,
    profile: finalProfile,
    transformations,
    version: `v${Date.now()}`,
    originalDatasetId: 'original'
  };
};

/**
 * Split data into training and testing sets
 * @param data 2D array of data
 * @param trainRatio Ratio of data to use for training
 * @param stratify Whether to stratify by target column
 * @param targetColumnIndex Index of target column for stratification
 * @returns Training and testing data
 */
export const trainTestSplit = (
  data: any[][],
  trainRatio: number = 0.8,
  stratify: boolean = false,
  targetColumnIndex?: number
): {
  trainData: any[][];
  testData: any[][];
  trainIndices: number[];
  testIndices: number[];
} => {
  if (stratify && targetColumnIndex === undefined) {
    stratify = false;
  }
  
  if (stratify && targetColumnIndex !== undefined) {
    // Stratified split
    const targetValues = data.map(row => row[targetColumnIndex]);
    const uniqueTargets = [...new Set(targetValues)];
    
    // Group indices by target value
    const indicesByTarget: Record<string, number[]> = {};
    targetValues.forEach((value, index) => {
      if (!indicesByTarget[value]) {
        indicesByTarget[value] = [];
      }
      indicesByTarget[value].push(index);
    });
    
    // Split each target group and combine
    let trainIndices: number[] = [];
    let testIndices: number[] = [];
    
    Object.values(indicesByTarget).forEach(indices => {
      // Shuffle indices
      const shuffled = [...indices].sort(() => Math.random() - 0.5);
      
      // Split based on ratio
      const trainSize = Math.round(shuffled.length * trainRatio);
      trainIndices = [...trainIndices, ...shuffled.slice(0, trainSize)];
      testIndices = [...testIndices, ...shuffled.slice(trainSize)];
    });
    
    return {
      trainData: trainIndices.map(i => data[i]),
      testData: testIndices.map(i => data[i]),
      trainIndices,
      testIndices
    };
  } else {
    // Random split
    const indices = Array.from({ length: data.length }, (_, i) => i);
    const shuffled = [...indices].sort(() => Math.random() - 0.5);
    
    const trainSize = Math.round(data.length * trainRatio);
    const trainIndices = shuffled.slice(0, trainSize);
    const testIndices = shuffled.slice(trainSize);
    
    return {
      trainData: trainIndices.map(i => data[i]),
      testData: testIndices.map(i => data[i]),
      trainIndices,
      testIndices
    };
  }
};

/**
 * Process a dataset in batches to handle large datasets
 * @param data 2D array of data
 * @param columns Column names
 * @param options Preprocessing options
 * @param batchSize Size of each batch
 * @param progressCallback Callback for progress updates
 * @returns Preprocessed data and metadata
 */
export const batchProcessDataset = async (
  data: any[][],
  columns: string[],
  options: PreprocessingOptions,
  batchSize: number = 1000,
  progressCallback?: (progress: number) => void
): Promise<PreprocessingResult> => {
  // Generate initial profile for the entire dataset
  const columnTypes = inferColumnTypes(columns, data);
  const initialProfile = generateDataProfile(data, columns);
  
  // Track transformations
  const transformations: {
    type: string;
    params: Record<string, any>;
    affectedColumns: string[];
    affectedRows: number;
    timestamp: string;
  }[] = [];
  
  // Process in batches
  const numBatches = Math.ceil(data.length / batchSize);
  let processedData: any[][] = [];
  let currentColumns = [...columns];
  
  for (let i = 0; i < numBatches; i++) {
    // Get current batch
    const start = i * batchSize;
    const end = Math.min(start + batchSize, data.length);
    const batchData = data.slice(start, end);
    
    // Process batch
    const batchResult = applyPreprocessingPipeline(batchData, currentColumns, options);
    
    // Update columns if they changed
    if (batchResult.columns.length !== currentColumns.length) {
      currentColumns = batchResult.columns;
      
      // If columns changed, we need to reprocess previous batches
      if (i > 0) {
        // This is simplified - in a real implementation, you'd need to handle this more carefully
        // For now, we'll just concatenate the processed data and note that there might be inconsistencies
        console.warn('Column structure changed during batch processing. Results may be inconsistent.');
      }
    }
    
    // Append processed batch
    processedData = [...processedData, ...batchResult.data];
    
    // Update transformations
    transformations.push(...batchResult.transformations);
    
    // Report progress
    if (progressCallback) {
      progressCallback((i + 1) / numBatches);
    }
    
    // Allow UI to update by yielding to the event loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  // Generate final profile
  const finalProfile = generateDataProfile(processedData, currentColumns);
  
  return {
    data: processedData,
    columns: currentColumns,
    profile: finalProfile,
    transformations,
    version: `v${Date.now()}`,
    originalDatasetId: 'original'
  };
};

/**
 * Detect data drift between two datasets
 * @param referenceData Reference dataset
 * @param currentData Current dataset
 * @param columns Column names
 * @param columnTypes Column types
 * @returns Drift scores for each column
 */
export const detectDataDrift = (
  referenceData: any[][],
  currentData: any[][],
  columns: string[],
  columnTypes: Record<string, string>
): Record<string, { driftScore: number; status: 'normal' | 'warning' | 'critical' }> => {
  const driftResults: Record<string, { driftScore: number; status: 'normal' | 'warning' | 'critical' }> = {};
  
  columns.forEach((col, colIndex) => {
    const refValues = referenceData.map(row => row[colIndex])
      .filter(v => v !== null && v !== undefined && v !== '');
    
    const currValues = currentData.map(row => row[colIndex])
      .filter(v => v !== null && v !== undefined && v !== '');
    
    if (refValues.length === 0 || currValues.length === 0) {
      driftResults[col] = { driftScore: 0, status: 'normal' };
      return;
    }
    
    if (columnTypes[col] === 'numeric') {
      // For numeric columns, compare distribution statistics
      const refStats = calculateColumnStats(refValues, 'numeric');
      const currStats = calculateColumnStats(currValues, 'numeric');
      
      // Calculate drift based on mean and std deviation changes
      const meanDrift = Math.abs((currStats.mean - refStats.mean) / refStats.mean);
      const stdDrift = Math.abs((currStats.std - refStats.std) / refStats.std);
      
      const driftScore = (meanDrift + stdDrift) / 2;
      
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (driftScore > 0.7) status = 'critical';
      else if (driftScore > 0.4) status = 'warning';
      
      driftResults[col] = { driftScore, status };
    } else if (columnTypes[col] === 'categorical') {
      // For categorical columns, compare value distributions
      const refCounts: Record<string, number> = {};
      const currCounts: Record<string, number> = {};
      
      refValues.forEach(v => {
        refCounts[v] = (refCounts[v] || 0) + 1;
      });
      
      currValues.forEach(v => {
        currCounts[v] = (currCounts[v] || 0) + 1;
      });
      
      // Calculate Population Stability Index (PSI)
      const allCategories = [...new Set([...Object.keys(refCounts), ...Object.keys(currCounts)])];
      
      let psi = 0;
      allCategories.forEach(category => {
        const refPct = (refCounts[category] || 0) / refValues.length;
        const currPct = (currCounts[category] || 0) / currValues.length;
        
        // Add a small epsilon to avoid division by zero
        const epsilon = 0.0001;
        
        if (refPct > 0 && currPct > 0) {
          psi += (currPct - refPct) * Math.log((currPct + epsilon) / (refPct + epsilon));
        }
      });
      
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (psi > 0.25) status = 'critical';
      else if (psi > 0.1) status = 'warning';
      
      driftResults[col] = { driftScore: psi, status };
    } else {
      // For other column types, use a simple ratio of matching values
      const refSet = new Set(refValues);
      const currSet = new Set(currValues);
      
      const intersection = new Set([...refSet].filter(x => currSet.has(x)));
      const union = new Set([...refSet, ...currSet]);
      
      const jaccard = 1 - (intersection.size / union.size);
      
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (jaccard > 0.7) status = 'critical';
      else if (jaccard > 0.4) status = 'warning';
      
      driftResults[col] = { driftScore: jaccard, status };
    }
  });
  
  return driftResults;
};