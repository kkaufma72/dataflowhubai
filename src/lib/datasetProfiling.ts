/**
 * Dataset Profiling & Smart Recommendations
 * 
 * Analyzes datasets to provide intelligent suggestions for model training:
 * - Auto-detect categorical vs numeric targets
 * - Recommend algorithms based on data characteristics
 * - Calculate confidence scores for recommendations
 * - Identify data issues that could affect training
 */

import { Dataset } from '../types';

export interface ColumnProfile {
  name: string;
  type: 'categorical' | 'numeric' | 'datetime' | 'text' | 'boolean';
  uniqueValues: number;
  nullPercentage: number;
  sampleValues: any[];
  stats?: {
    mean?: number;
    median?: number;
    min?: number;
    max?: number;
    stdDev?: number;
  };
  isTarget?: boolean; // Likely target variable
}

export interface AlgorithmRecommendation {
  algorithm: string;
  name: string;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0-100
  reasoning: string[];
  pros: string[];
  cons: string[];
  estimatedTrainingTime: string; // "2-5 minutes"
  hyperparameters?: Record<string, any>;
}

export interface ModelTypeRecommendation {
  type: 'classification' | 'regression';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  targetColumn?: string;
}

export interface DatasetProfileResult {
  columns: ColumnProfile[];
  rowCount: number;
  columnCount: number;
  targetRecommendations: string[]; // Suggested target columns
  modelTypeRecommendation: ModelTypeRecommendation | null;
  algorithmRecommendations: AlgorithmRecommendation[];
  dataQualityIssues: string[];
  readyForTraining: boolean;
}

/**
 * Profile a dataset and generate intelligent recommendations
 */
export async function profileDataset(dataset: Dataset): Promise<DatasetProfileResult> {
  if (!dataset.preview_data?.columns || !dataset.preview_data?.rows) {
    throw new Error('Dataset preview data is required for profiling');
  }

  const { columns: columnNames, rows } = dataset.preview_data;
  
  // Profile each column
  const columns: ColumnProfile[] = columnNames.map((name, colIdx) => {
    const values = rows.map(row => row[colIdx]).filter(v => v !== null && v !== undefined && v !== '');
    const uniqueValues = new Set(values).size;
    const nullCount = rows.length - values.length;
    const nullPercentage = (nullCount / rows.length) * 100;
    
    // Sample first 5 values
    const sampleValues = values.slice(0, 5);
    
    // Detect column type
    const type = inferColumnType(values);
    
    // Calculate stats for numeric columns
    let stats: ColumnProfile['stats'] = undefined;
    if (type === 'numeric') {
      const numericValues = values.map(v => parseFloat(String(v))).filter(v => !isNaN(v));
      if (numericValues.length > 0) {
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
        
        stats = {
          mean,
          median: sorted[Math.floor(sorted.length / 2)],
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          stdDev: Math.sqrt(variance),
        };
      }
    }
    
    // Check if likely target variable (last column with suitable properties)
    const isLastColumn = colIdx === columnNames.length - 1;
    const hasTargetNaming = /target|label|class|category|outcome|result|prediction/i.test(name);
    const suitableCardinality = type === 'categorical' && uniqueValues >= 2 && uniqueValues <= 20;
    const isTarget = (isLastColumn || hasTargetNaming) && (suitableCardinality || type === 'numeric');
    
    return {
      name,
      type,
      uniqueValues,
      nullPercentage,
      sampleValues,
      stats,
      isTarget,
    };
  });
  
  // Identify target recommendations
  const targetRecommendations = columns
    .filter(col => col.isTarget || 
      (col.type === 'categorical' && col.uniqueValues >= 2 && col.uniqueValues <= 20) ||
      (col.type === 'numeric' && col.nullPercentage < 5)
    )
    .map(col => col.name);
  
  // Determine model type based on likely targets
  const modelTypeRecommendation = inferModelType(columns, targetRecommendations);
  
  // Recommend algorithms based on dataset characteristics
  const algorithmRecommendations = recommendAlgorithms(
    columns,
    rows.length,
    modelTypeRecommendation?.type || 'classification'
  );
  
  // Identify data quality issues
  const dataQualityIssues: string[] = [];
  
  columns.forEach(col => {
    if (col.nullPercentage > 20) {
      dataQualityIssues.push(`Column "${col.name}" has ${col.nullPercentage.toFixed(1)}% missing values`);
    }
  });
  
  if (rows.length < 50) {
    dataQualityIssues.push(`Dataset has only ${rows.length} rows - models may overfit. Recommend 100+ rows for training.`);
  }
  
  if (columns.length < 2) {
    dataQualityIssues.push(`Dataset has only ${columns.length} columns - need at least 2 columns (features + target).`);
  }
  
  const categoricalCols = columns.filter(col => col.type === 'categorical');
  if (categoricalCols.length > columns.length * 0.8) {
    dataQualityIssues.push(`${categoricalCols.length} categorical columns detected - ensure proper encoding is applied.`);
  }
  
  const readyForTraining = dataQualityIssues.length === 0 && 
    rows.length >= 50 && 
    columns.length >= 2 &&
    targetRecommendations.length > 0;
  
  return {
    columns,
    rowCount: rows.length,
    columnCount: columns.length,
    targetRecommendations,
    modelTypeRecommendation,
    algorithmRecommendations,
    dataQualityIssues,
    readyForTraining,
  };
}

/**
 * Infer column type from sample values
 */
function inferColumnType(values: any[]): ColumnProfile['type'] {
  if (values.length === 0) return 'text';
  
  // Check for boolean
  const booleanValues = new Set(['true', 'false', '0', '1', 'yes', 'no']);
  const uniqueLower = new Set(values.map(v => String(v).toLowerCase()));
  if (uniqueLower.size <= 2 && [...uniqueLower].every(v => booleanValues.has(v))) {
    return 'boolean';
  }
  
  // Check for numeric
  const numericCount = values.filter(v => !isNaN(parseFloat(String(v)))).length;
  if (numericCount / values.length > 0.9) {
    return 'numeric';
  }
  
  // Check for datetime
  const dateCount = values.filter(v => {
    const dateStr = String(v);
    return !isNaN(Date.parse(dateStr)) && /\d{4}[-/]\d{2}[-/]\d{2}/.test(dateStr);
  }).length;
  if (dateCount / values.length > 0.9) {
    return 'datetime';
  }
  
  // Check for categorical (limited unique values)
  const uniqueCount = new Set(values).size;
  if (uniqueCount <= values.length * 0.5 && uniqueCount <= 50) {
    return 'categorical';
  }
  
  return 'text';
}

/**
 * Infer model type from column profiles
 */
function inferModelType(
  columns: ColumnProfile[],
  targetRecommendations: string[]
): ModelTypeRecommendation | null {
  if (targetRecommendations.length === 0) {
    return null;
  }
  
  // Check first recommended target
  const targetCol = columns.find(col => col.name === targetRecommendations[0]);
  if (!targetCol) return null;
  
  if (targetCol.type === 'categorical' || targetCol.type === 'boolean') {
    return {
      type: 'classification',
      confidence: targetCol.uniqueValues >= 2 && targetCol.uniqueValues <= 10 ? 'high' : 'medium',
      reasoning: `Target column "${targetCol.name}" has ${targetCol.uniqueValues} unique categorical values - ideal for classification`,
      targetColumn: targetCol.name,
    };
  }
  
  if (targetCol.type === 'numeric') {
    const isLikelyDiscrete = targetCol.uniqueValues <= 20;
    
    if (isLikelyDiscrete) {
      return {
        type: 'classification',
        confidence: 'medium',
        reasoning: `Target column "${targetCol.name}" is numeric with ${targetCol.uniqueValues} unique values - may be discrete classes`,
        targetColumn: targetCol.name,
      };
    } else {
      return {
        type: 'regression',
        confidence: 'high',
        reasoning: `Target column "${targetCol.name}" is continuous numeric - ideal for regression`,
        targetColumn: targetCol.name,
      };
    }
  }
  
  return null;
}

/**
 * Recommend algorithms based on dataset characteristics
 */
function recommendAlgorithms(
  columns: ColumnProfile[],
  rowCount: number,
  modelType: 'classification' | 'regression'
): AlgorithmRecommendation[] {
  const featureCount = columns.length - 1; // Exclude target
  const categoricalCount = columns.filter(col => col.type === 'categorical').length;
  const numericCount = columns.filter(col => col.type === 'numeric').length;
  
  const isSmallDataset = rowCount < 1000;
  const isMediumDataset = rowCount >= 1000 && rowCount < 10000;
  const isLargeDataset = rowCount >= 10000;
  
  const recommendations: AlgorithmRecommendation[] = [];
  
  if (modelType === 'classification') {
    // Random Forest - versatile, works well on most datasets
    recommendations.push({
      algorithm: 'random_forest',
      name: 'Random Forest',
      confidence: 'high',
      confidenceScore: 90,
      reasoning: [
        'Handles mixed data types (categorical + numeric) well',
        'Robust to outliers and missing values',
        'Provides feature importance rankings',
        isSmallDataset ? 'May overfit on small datasets' : 'Excellent for this dataset size'
      ],
      pros: [
        'No data scaling required',
        'Handles non-linear relationships',
        'Built-in feature importance'
      ],
      cons: [
        isSmallDataset ? 'Can overfit with too few samples' : 'Slower training on very large datasets',
        'Black box - less interpretable than decision trees'
      ],
      estimatedTrainingTime: isSmallDataset ? '<1 min' : isMediumDataset ? '2-5 min' : '5-15 min',
      hyperparameters: {
        n_estimators: isLargeDataset ? 200 : 100,
        max_depth: isSmallDataset ? 10 : 20,
        min_samples_split: 2,
      }
    });
    
    // XGBoost - high performance
    if (!isSmallDataset) {
      recommendations.push({
        algorithm: 'xgboost',
        name: 'XGBoost',
        confidence: 'high',
        confidenceScore: 95,
        reasoning: [
          'State-of-art gradient boosting performance',
          'Excellent with structured data',
          'Handles missing values internally',
          `Optimized for datasets with ${rowCount.toLocaleString()} rows`
        ],
        pros: [
          'Highest accuracy potential',
          'Fast training with parallelization',
          'Built-in regularization'
        ],
        cons: [
          'More hyperparameters to tune',
          'Sensitive to noisy data'
        ],
        estimatedTrainingTime: isMediumDataset ? '3-7 min' : '7-20 min',
        hyperparameters: {
          learning_rate: 0.1,
          max_depth: 6,
          n_estimators: 100,
        }
      });
    }
    
    // Logistic Regression - simple, interpretable
    if (featureCount <= 50 && numericCount > categoricalCount) {
      recommendations.push({
        algorithm: 'logistic_regression',
        name: 'Logistic Regression',
        confidence: 'medium',
        confidenceScore: 70,
        reasoning: [
          'Fast training and prediction',
          'Highly interpretable coefficients',
          'Works well with mostly numeric features'
        ],
        pros: [
          'Very fast (<1 min)',
          'Probabilistic outputs',
          'Easy to explain to stakeholders'
        ],
        cons: [
          'Assumes linear relationships',
          'Poor with complex non-linear patterns',
          'Requires feature scaling'
        ],
        estimatedTrainingTime: '<1 min',
      });
    }
    
    // Neural Network - for larger datasets
    if (isLargeDataset) {
      recommendations.push({
        algorithm: 'neural_network',
        name: 'Neural Network',
        confidence: 'medium',
        confidenceScore: 75,
        reasoning: [
          'Can learn complex patterns',
          'Scales well to large datasets',
          'Flexible architecture'
        ],
        pros: [
          'Handles complex non-linear relationships',
          'Continuous learning possible'
        ],
        cons: [
          'Requires more training data',
          'Longer training time',
          'Needs hyperparameter tuning'
        ],
        estimatedTrainingTime: '10-30 min',
      });
    }
    
  } else { // Regression
    // Random Forest Regressor
    recommendations.push({
      algorithm: 'random_forest',
      name: 'Random Forest Regressor',
      confidence: 'high',
      confidenceScore: 88,
      reasoning: [
        'Handles non-linear relationships well',
        'Robust to outliers',
        'No scaling required'
      ],
      pros: [
        'Versatile and reliable',
        'Feature importance built-in',
        'Works with mixed data types'
      ],
      cons: [
        'Can be slow on large datasets',
        'Less interpretable than linear models'
      ],
      estimatedTrainingTime: isSmallDataset ? '<1 min' : isMediumDataset ? '2-5 min' : '5-15 min',
    });
    
    // Linear Regression - baseline
    if (numericCount > categoricalCount) {
      recommendations.push({
        algorithm: 'linear_regression',
        name: 'Linear Regression',
        confidence: 'medium',
        confidenceScore: 72,
        reasoning: [
          'Fast and interpretable baseline',
          'Works well with linear relationships',
          'Provides coefficient insights'
        ],
        pros: [
          'Extremely fast (<1 min)',
          'Highly interpretable',
          'Good for linear trends'
        ],
        cons: [
          'Poor with non-linear patterns',
          'Sensitive to outliers',
          'Requires feature scaling'
        ],
        estimatedTrainingTime: '<1 min',
      });
    }
    
    // XGBoost Regressor
    if (!isSmallDataset) {
      recommendations.push({
        algorithm: 'xgboost',
        name: 'XGBoost Regressor',
        confidence: 'high',
        confidenceScore: 92,
        reasoning: [
          'Superior performance on structured data',
          'Handles missing values',
          'Built-in regularization'
        ],
        pros: [
          'Highest accuracy potential',
          'Fast with GPU acceleration',
          'Excellent generalization'
        ],
        cons: [
          'More hyperparameters to tune',
          'Requires more training time'
        ],
        estimatedTrainingTime: isMediumDataset ? '3-7 min' : '7-20 min',
      });
    }
  }
  
  // Sort by confidence score
  return recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/**
 * Get confidence badge color
 */
export function getConfidenceBadgeColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'medium':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'low':
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Get confidence icon
 */
export function getConfidenceIcon(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return '⭐⭐⭐';
    case 'medium':
      return '⭐⭐';
    case 'low':
      return '⭐';
  }
}
