import * as tf from '@tensorflow/tfjs';

export interface FeatureTransformation {
  type: 'scaling' | 'normalization' | 'encoding' | 'binning' | 'custom';
  features: string[];
  config: Record<string, any>;
}

export interface TimeSeriesConfig {
  timestampColumn: string;
  lagFeatures: {feature: string; lags: number[]}[];
  rollingFeatures: {feature: string; windows: number[]; operations: ('mean' | 'sum' | 'min' | 'max' | 'std')[]}[];
  seasonalFeatures: boolean;
}

export class FeatureEngineer {
  private data: any[];
  private columns: string[];
  private transformations: FeatureTransformation[];
  private timeSeriesConfig: TimeSeriesConfig | null;
  private featureStats: Record<string, {
    min?: number;
    max?: number;
    mean?: number;
    std?: number;
    categories?: string[];
  }>;

  constructor(
    data: any[],
    columns: string[],
    transformations: FeatureTransformation[] = [],
    timeSeriesConfig: TimeSeriesConfig | null = null
  ) {
    this.data = data;
    this.columns = columns;
    this.transformations = transformations;
    this.timeSeriesConfig = timeSeriesConfig;
    this.featureStats = {};
    
    // Calculate statistics for each feature
    this.calculateFeatureStats();
  }

  private calculateFeatureStats() {
    this.columns.forEach((column, colIndex) => {
      const values = this.data.map(row => row[colIndex]);
      const numericValues = values
        .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
        .map(v => Number(v));
      
      if (numericValues.length > 0) {
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
        const std = Math.sqrt(variance);
        
        this.featureStats[column] = { min, max, mean, std };
      } else {
        // For categorical features
        const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
        const categories = [...new Set(nonNullValues)];
        
        this.featureStats[column] = { categories };
      }
    });
  }

  public transform(): { data: any[]; columns: string[] } {
    let transformedData = [...this.data];
    let transformedColumns = [...this.columns];
    
    // Apply feature transformations
    this.transformations.forEach(transformation => {
      const result = this.applyTransformation(transformedData, transformedColumns, transformation);
      transformedData = result.data;
      transformedColumns = result.columns;
    });
    
    // Apply time series transformations if configured
    if (this.timeSeriesConfig && this.timeSeriesConfig.timestampColumn) {
      const result = this.applyTimeSeriesTransformations(transformedData, transformedColumns);
      transformedData = result.data;
      transformedColumns = result.columns;
    }
    
    return { data: transformedData, columns: transformedColumns };
  }

  private applyTransformation(
    data: any[],
    columns: string[],
    transformation: FeatureTransformation
  ): { data: any[]; columns: string[] } {
    let newData = [...data];
    let newColumns = [...columns];
    
    switch (transformation.type) {
      case 'scaling':
        return this.applyScaling(newData, newColumns, transformation);
      case 'normalization':
        return this.applyNormalization(newData, newColumns, transformation);
      case 'encoding':
        return this.applyEncoding(newData, newColumns, transformation);
      case 'binning':
        return this.applyBinning(newData, newColumns, transformation);
      case 'custom':
        return this.applyCustomTransformation(newData, newColumns, transformation);
      default:
        return { data: newData, columns: newColumns };
    }
  }

  private applyScaling(
    data: any[],
    columns: string[],
    transformation: FeatureTransformation
  ): { data: any[]; columns: string[] } {
    const { features, config } = transformation;
    const method = config.method || 'min-max';
    const rangeMin = config.range_min !== undefined ? config.range_min : 0;
    const rangeMax = config.range_max !== undefined ? config.range_max : 1;
    
    const newData = [...data];
    
    features.forEach(feature => {
      const featureIndex = columns.indexOf(feature);
      if (featureIndex === -1) return;
      
      const stats = this.featureStats[feature];
      if (!stats || stats.min === undefined) return;
      
      for (let i = 0; i < newData.length; i++) {
        const value = Number(newData[i][featureIndex]);
        if (isNaN(value)) continue;
        
        let scaledValue;
        
        if (method === 'min-max') {
          // Min-max scaling
          scaledValue = ((value - stats.min!) / (stats.max! - stats.min!)) * (rangeMax - rangeMin) + rangeMin;
        } else if (method === 'standard') {
          // Standard scaling (z-score)
          scaledValue = (value - stats.mean!) / stats.std!;
        } else if (method === 'robust') {
          // Robust scaling using median and IQR (simplified)
          scaledValue = (value - stats.mean!) / (stats.max! - stats.min!);
        }
        
        newData[i][featureIndex] = scaledValue;
      }
    });
    
    return { data: newData, columns };
  }

  private applyNormalization(
    data: any[],
    columns: string[],
    transformation: FeatureTransformation
  ): { data: any[]; columns: string[] } {
    const { features, config } = transformation;
    const method = config.method || 'z-score';
    
    const newData = [...data];
    
    features.forEach(feature => {
      const featureIndex = columns.indexOf(feature);
      if (featureIndex === -1) return;
      
      const stats = this.featureStats[feature];
      if (!stats || stats.mean === undefined) return;
      
      for (let i = 0; i < newData.length; i++) {
        const value = Number(newData[i][featureIndex]);
        if (isNaN(value)) continue;
        
        let normalizedValue;
        
        if (method === 'z-score') {
          // Z-score normalization
          normalizedValue = (value - stats.mean!) / stats.std!;
        } else if (method === 'decimal-scaling') {
          // Decimal scaling
          const scale = Math.pow(10, Math.ceil(Math.log10(stats.max!)));
          normalizedValue = value / scale;
        } else if (method === 'log') {
          // Log transformation
          normalizedValue = Math.log(Math.max(value, 1e-10));
        }
        
        newData[i][featureIndex] = normalizedValue;
      }
    });
    
    return { data: newData, columns };
  }

  private applyEncoding(
    data: any[],
    columns: string[],
    transformation: FeatureTransformation
  ): { data: any[]; columns: string[] } {
    const { features, config } = transformation;
    const method = config.method || 'one-hot';
    
    let newData = [...data];
    let newColumns = [...columns];
    
    features.forEach(feature => {
      const featureIndex = columns.indexOf(feature);
      if (featureIndex === -1) return;
      
      const stats = this.featureStats[feature];
      if (!stats || !stats.categories) return;
      
      if (method === 'one-hot') {
        // One-hot encoding
        const categories = stats.categories;
        
        // Create new columns for each category
        const newFeatureIndices: number[] = [];
        
        categories.forEach(category => {
          const newColumnName = `${feature}_${category}`;
          newColumns.push(newColumnName);
          newFeatureIndices.push(newColumns.length - 1);
          
          // Add new column to data with 0s
          for (let i = 0; i < newData.length; i++) {
            newData[i].push(0);
          }
        });
        
        // Fill in one-hot values
        for (let i = 0; i < newData.length; i++) {
          const value = newData[i][featureIndex];
          const categoryIndex = categories.indexOf(value);
          
          if (categoryIndex !== -1) {
            newData[i][newFeatureIndices[categoryIndex]] = 1;
          }
        }
        
        // Optionally remove original column
        // This would require adjusting all indices
      } else if (method === 'label') {
        // Label encoding
        const categories = stats.categories;
        
        for (let i = 0; i < newData.length; i++) {
          const value = newData[i][featureIndex];
          const categoryIndex = categories.indexOf(value);
          
          newData[i][featureIndex] = categoryIndex !== -1 ? categoryIndex : -1;
        }
      }
      // Other encoding methods would be implemented similarly
    });
    
    return { data: newData, columns: newColumns };
  }

  private applyBinning(
    data: any[],
    columns: string[],
    transformation: FeatureTransformation
  ): { data: any[]; columns: string[] } {
    const { features, config } = transformation;
    const nBins = config.n_bins || 5;
    const strategy = config.strategy || 'uniform';
    const encode = config.encode || 'ordinal';
    
    let newData = [...data];
    let newColumns = [...columns];
    
    features.forEach(feature => {
      const featureIndex = columns.indexOf(feature);
      if (featureIndex === -1) return;
      
      const stats = this.featureStats[feature];
      if (!stats || stats.min === undefined) return;
      
      if (strategy === 'uniform') {
        // Uniform binning
        const binWidth = (stats.max! - stats.min!) / nBins;
        
        if (encode === 'ordinal') {
          // Ordinal encoding - replace with bin index
          for (let i = 0; i < newData.length; i++) {
            const value = Number(newData[i][featureIndex]);
            if (isNaN(value)) continue;
            
            const binIndex = Math.min(Math.floor((value - stats.min!) / binWidth), nBins - 1);
            newData[i][featureIndex] = binIndex;
          }
        } else if (encode === 'onehot') {
          // One-hot encoding for bins
          const newFeatureIndices: number[] = [];
          
          // Create new columns for each bin
          for (let bin = 0; bin < nBins; bin++) {
            const newColumnName = `${feature}_bin_${bin}`;
            newColumns.push(newColumnName);
            newFeatureIndices.push(newColumns.length - 1);
            
            // Add new column to data with 0s
            for (let i = 0; i < newData.length; i++) {
              newData[i].push(0);
            }
          }
          
          // Fill in one-hot values
          for (let i = 0; i < newData.length; i++) {
            const value = Number(newData[i][featureIndex]);
            if (isNaN(value)) continue;
            
            const binIndex = Math.min(Math.floor((value - stats.min!) / binWidth), nBins - 1);
            newData[i][newFeatureIndices[binIndex]] = 1;
          }
        }
      }
      // Other binning strategies would be implemented similarly
    });
    
    return { data: newData, columns: newColumns };
  }

  private applyCustomTransformation(
    data: any[],
    columns: string[],
    transformation: FeatureTransformation
  ): { data: any[]; columns: string[] } {
    const { features, config } = transformation;
    const expression = config.expression || 'x => x';
    const outputName = config.output_name || 'custom_feature';
    
    let newData = [...data];
    let newColumns = [...columns];
    
    // Add new column for the custom feature
    newColumns.push(outputName);
    const newFeatureIndex = newColumns.length - 1;
    
    // Add placeholder values
    for (let i = 0; i < newData.length; i++) {
      newData[i].push(null);
    }
    
    // Apply custom transformation
    try {
      const transformFn = new Function('x', `return ${expression}`);
      
      for (let i = 0; i < newData.length; i++) {
        const featureValues: Record<string, any> = {};
        
        // Collect values for all input features
        features.forEach(feature => {
          const featureIndex = columns.indexOf(feature);
          if (featureIndex !== -1) {
            featureValues[feature] = newData[i][featureIndex];
          }
        });
        
        // Apply transformation
        try {
          const result = transformFn(featureValues);
          newData[i][newFeatureIndex] = result;
        } catch (error) {
          console.error('Error applying custom transformation:', error);
          newData[i][newFeatureIndex] = null;
        }
      }
    } catch (error) {
      console.error('Error parsing custom transformation:', error);
    }
    
    return { data: newData, columns: newColumns };
  }

  private applyTimeSeriesTransformations(
    data: any[],
    columns: string[]
  ): { data: any[]; columns: string[] } {
    if (!this.timeSeriesConfig || !this.timeSeriesConfig.timestampColumn) {
      return { data, columns };
    }
    
    let newData = [...data];
    let newColumns = [...columns];
    
    const timestampColIndex = columns.indexOf(this.timeSeriesConfig.timestampColumn);
    if (timestampColIndex === -1) return { data, columns };
    
    // Sort data by timestamp
    const sortedIndices = Array.from({ length: newData.length }, (_, i) => i)
      .sort((a, b) => {
        const dateA = new Date(newData[a][timestampColIndex]);
        const dateB = new Date(newData[b][timestampColIndex]);
        return dateA.getTime() - dateB.getTime();
      });
    
    newData = sortedIndices.map(i => newData[i]);
    
    // Apply lag features
    if (this.timeSeriesConfig.lagFeatures.length > 0) {
      newData = this.applyLagFeatures(newData, newColumns);
    }
    
    // Apply rolling window features
    if (this.timeSeriesConfig.rollingFeatures.length > 0) {
      newData = this.applyRollingFeatures(newData, newColumns);
    }
    
    // Apply seasonal features
    if (this.timeSeriesConfig.seasonalFeatures) {
      newData = this.applySeasonalFeatures(newData, newColumns, timestampColIndex);
    }
    
    return { data: newData, columns: newColumns };
  }

  private applyLagFeatures(data: any[], columns: string[]): any[] {
    let newData = [...data];
    
    this.timeSeriesConfig!.lagFeatures.forEach(lagFeature => {
      const featureIndex = columns.indexOf(lagFeature.feature);
      if (featureIndex === -1) return;
      
      lagFeature.lags.forEach(lag => {
        const newColumnName = `${lagFeature.feature}_lag_${lag}`;
        columns.push(newColumnName);
        const newFeatureIndex = columns.length - 1;
        
        // Add new column with nulls
        for (let i = 0; i < newData.length; i++) {
          newData[i].push(null);
        }
        
        // Fill in lag values
        for (let i = lag; i < newData.length; i++) {
          newData[i][newFeatureIndex] = newData[i - lag][featureIndex];
        }
      });
    });
    
    return newData;
  }

  private applyRollingFeatures(data: any[], columns: string[]): any[] {
    let newData = [...data];
    
    this.timeSeriesConfig!.rollingFeatures.forEach(rollingFeature => {
      const featureIndex = columns.indexOf(rollingFeature.feature);
      if (featureIndex === -1) return;
      
      rollingFeature.windows.forEach(window => {
        rollingFeature.operations.forEach(operation => {
          const newColumnName = `${rollingFeature.feature}_${operation}_${window}`;
          columns.push(newColumnName);
          const newFeatureIndex = columns.length - 1;
          
          // Add new column with nulls
          for (let i = 0; i < newData.length; i++) {
            newData[i].push(null);
          }
          
          // Fill in rolling values
          for (let i = window - 1; i < newData.length; i++) {
            const windowValues = [];
            
            for (let j = 0; j < window; j++) {
              const value = Number(newData[i - j][featureIndex]);
              if (!isNaN(value)) {
                windowValues.push(value);
              }
            }
            
            if (windowValues.length > 0) {
              let result;
              
              switch (operation) {
                case 'mean':
                  result = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
                  break;
                case 'sum':
                  result = windowValues.reduce((sum, val) => sum + val, 0);
                  break;
                case 'min':
                  result = Math.min(...windowValues);
                  break;
                case 'max':
                  result = Math.max(...windowValues);
                  break;
                case 'std':
                  const mean = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
                  const variance = windowValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowValues.length;
                  result = Math.sqrt(variance);
                  break;
              }
              
              newData[i][newFeatureIndex] = result;
            }
          }
        });
      });
    });
    
    return newData;
  }

  private applySeasonalFeatures(data: any[], columns: string[], timestampColIndex: number): any[] {
    let newData = [...data];
    
    // Define seasonal features to extract
    const seasonalFeatures = [
      { name: 'hour_of_day', fn: (date: Date) => date.getHours() },
      { name: 'day_of_week', fn: (date: Date) => date.getDay() },
      { name: 'day_of_month', fn: (date: Date) => date.getDate() },
      { name: 'day_of_year', fn: (date: Date) => {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date.getTime() - start.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      }},
      { name: 'week_of_year', fn: (date: Date) => {
        const start = new Date(date.getFullYear(), 0, 1);
        const diff = date.getTime() - start.getTime();
        return Math.ceil((diff / (1000 * 60 * 60 * 24) + start.getDay() + 1) / 7);
      }},
      { name: 'month', fn: (date: Date) => date.getMonth() + 1 },
      { name: 'quarter', fn: (date: Date) => Math.floor(date.getMonth() / 3) + 1 },
      { name: 'year', fn: (date: Date) => date.getFullYear() },
      { name: 'is_weekend', fn: (date: Date) => date.getDay() === 0 || date.getDay() === 6 ? 1 : 0 },
      { name: 'is_holiday', fn: (date: Date) => {
        // Simplified holiday detection (just check for major US holidays)
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // New Year's Day, Independence Day, Christmas
        if ((month === 1 && day === 1) || (month === 7 && day === 4) || (month === 12 && day === 25)) {
          return 1;
        }
        
        return 0;
      }}
    ];
    
    seasonalFeatures.forEach(feature => {
      const newColumnName = feature.name;
      columns.push(newColumnName);
      const newFeatureIndex = columns.length - 1;
      
      // Add new column with nulls
      for (let i = 0; i < newData.length; i++) {
        newData[i].push(null);
      }
      
      // Fill in seasonal values
      for (let i = 0; i < newData.length; i++) {
        const timestamp = newData[i][timestampColIndex];
        try {
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            newData[i][newFeatureIndex] = feature.fn(date);
          }
        } catch (error) {
          console.error('Error parsing date:', error);
        }
      }
    });
    
    return newData;
  }

  public getFeatureImportance(): { feature: string; importance: number }[] {
    // This is a simplified implementation
    // In a real system, this would use a model to calculate feature importance
    
    const importance: { feature: string; importance: number }[] = [];
    
    this.columns.forEach(column => {
      // Generate a random importance score, but make it somewhat realistic
      let score = Math.random();
      
      // ID columns and metadata columns typically have lower importance
      if (
        column.toLowerCase().includes('id') || 
        column.toLowerCase().includes('_id') ||
        column.toLowerCase().includes('created_at') ||
        column.toLowerCase().includes('updated_at')
      ) {
        score *= 0.3; // Lower importance for ID and metadata columns
      }
      
      // Time series features often have higher importance
      if (
        column.includes('_lag_') ||
        column.includes('_mean_') ||
        column.includes('_sum_')
      ) {
        score = Math.min(score * 1.5, 0.95); // Boost importance for time series features
      }
      
      importance.push({
        feature: column,
        importance: score
      });
    });
    
    // Sort by importance (descending)
    importance.sort((a, b) => b.importance - a.importance);
    
    return importance;
  }

  public selectTopFeatures(threshold: number = 0.1): string[] {
    const importance = this.getFeatureImportance();
    return importance
      .filter(f => f.importance >= threshold)
      .map(f => f.feature);
  }
}