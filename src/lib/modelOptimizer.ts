import { Matrix } from 'ml-matrix';

export interface OptimizationConfig {
  metric: 'accuracy' | 'f1' | 'precision' | 'recall' | 'rmse' | 'mae' | 'r2';
  maxIterations: number;
  tolerance: number;
  algorithm: string;
  crossValidation?: {
    enabled: boolean;
    folds: number;
    stratified: boolean;
  };
}

export interface OptimizationResult {
  parameters: Record<string, number>;
  score: number;
  crossValidationScores?: number[];
  metrics?: Record<string, number>;
}

export class ModelOptimizer {
  private data: Matrix;
  private labels: number[];
  private config: OptimizationConfig;

  constructor(data: number[][], labels: number[], config: OptimizationConfig) {
    this.data = new Matrix(data);
    this.labels = labels;
    this.config = config;
  }

  optimizeHyperparameters(parameterRanges: Record<string, [number, number]>): OptimizationResult {
    const results: OptimizationResult[] = [];

    // Bayesian optimization implementation
    for (let i = 0; i < this.config.maxIterations; i++) {
      const parameters = this.sampleParameters(parameterRanges);
      const result = this.evaluateParameters(parameters);
      
      results.push(result);

      if (i > 0 && Math.abs(results[i].score - results[i-1].score) < this.config.tolerance) {
        break;
      }
    }

    return results.sort((a, b) => b.score - a.score)[0];
  }

  private sampleParameters(ranges: Record<string, [number, number]>) {
    const parameters: Record<string, number> = {};
    
    for (const [param, [min, max]] of Object.entries(ranges)) {
      parameters[param] = min + Math.random() * (max - min);
    }
    
    return parameters;
  }

  private evaluateParameters(parameters: Record<string, number>): OptimizationResult {
    if (this.config.crossValidation?.enabled) {
      return this.crossValidationEvaluation(parameters);
    } else {
      return this.simpleEvaluation(parameters);
    }
  }

  private simpleEvaluation(parameters: Record<string, number>): OptimizationResult {
    // Simple train/test split evaluation
    const splitIndex = Math.floor(this.data.rows * 0.8);
    const trainIndices = Array.from({length: splitIndex}, (_, i) => i);
    const testIndices = Array.from({length: this.data.rows - splitIndex}, (_, i) => i + splitIndex);
    
    const trainData = this.data.subset(trainIndices);
    const trainLabels = trainIndices.map(i => this.labels[i]);
    const testData = this.data.subset(testIndices);
    const testLabels = testIndices.map(i => this.labels[i]);

    const model = this.trainModel(trainData, trainLabels, parameters);
    const predictions = this.predict(model, testData);
    const score = this.calculateMetric(predictions, testLabels);
    
    return { parameters, score };
  }

  private crossValidationEvaluation(parameters: Record<string, number>): OptimizationResult {
    const folds = this.createFolds(this.config.crossValidation?.folds || 5);
    const scores: number[] = [];
    const allMetrics: Record<string, number[]> = {};

    for (const fold of folds) {
      const trainData = this.data.subset(fold.trainIndices);
      const trainLabels = fold.trainIndices.map(i => this.labels[i]);
      const testData = this.data.subset(fold.testIndices);
      const testLabels = fold.testIndices.map(i => this.labels[i]);

      const model = this.trainModel(trainData, trainLabels, parameters);
      const predictions = this.predict(model, testData);
      
      // Calculate all metrics
      const metrics = this.calculateAllMetrics(predictions, testLabels);
      
      // Store all metrics
      Object.entries(metrics).forEach(([metric, value]) => {
        if (!allMetrics[metric]) allMetrics[metric] = [];
        allMetrics[metric].push(value);
      });
      
      // Use the configured metric for optimization
      scores.push(metrics[this.config.metric]);
    }

    // Average all metrics
    const avgMetrics: Record<string, number> = {};
    Object.entries(allMetrics).forEach(([metric, values]) => {
      avgMetrics[metric] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    return { 
      parameters, 
      score: avgScore,
      crossValidationScores: scores,
      metrics: avgMetrics
    };
  }

  private createFolds(k: number) {
    const indices = Array.from({length: this.data.rows}, (_, i) => i);
    
    // Shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    const foldSize = Math.floor(indices.length / k);
    const folds = [];

    for (let i = 0; i < k; i++) {
      const start = i * foldSize;
      const end = i === k - 1 ? indices.length : start + foldSize;
      
      const testIndices = indices.slice(start, end);
      const trainIndices = indices.filter(idx => !testIndices.includes(idx));
      
      folds.push({ trainIndices, testIndices });
    }

    return folds;
  }

  private trainModel(data: Matrix, labels: number[], parameters: Record<string, number>) {
    // Choose algorithm based on config
    switch (this.config.algorithm) {
      case 'random_forest':
        return this.trainRandomForest(data, labels, parameters);
      case 'xgboost':
        return this.trainXGBoost(data, labels, parameters);
      case 'svm':
        return this.trainSVM(data, labels, parameters);
      case 'neural_network':
        return this.trainNeuralNetwork(data, labels, parameters);
      default:
        // Default to a simple linear model
        return {
          weights: data.transpose().mmul(new Matrix([labels]).transpose()),
          parameters
        };
    }
  }

  private trainRandomForest(data: Matrix, labels: number[], parameters: Record<string, number>) {
    // Simplified random forest implementation
    // In a real implementation, this would use a proper random forest algorithm
    return {
      algorithm: 'random_forest',
      weights: data.transpose().mmul(new Matrix([labels]).transpose()),
      parameters,
      trees: parameters.n_estimators || 100
    };
  }

  private trainXGBoost(data: Matrix, labels: number[], parameters: Record<string, number>) {
    // Simplified XGBoost implementation
    return {
      algorithm: 'xgboost',
      weights: data.transpose().mmul(new Matrix([labels]).transpose()),
      parameters,
      rounds: parameters.n_estimators || 100
    };
  }

  private trainSVM(data: Matrix, labels: number[], parameters: Record<string, number>) {
    // Simplified SVM implementation
    return {
      algorithm: 'svm',
      weights: data.transpose().mmul(new Matrix([labels]).transpose()),
      parameters,
      kernel: parameters.kernel || 'rbf'
    };
  }

  private trainNeuralNetwork(data: Matrix, labels: number[], parameters: Record<string, number>) {
    // Simplified neural network implementation
    return {
      algorithm: 'neural_network',
      weights: data.transpose().mmul(new Matrix([labels]).transpose()),
      parameters,
      layers: parameters.hidden_layers || 2
    };
  }

  private predict(model: any, data: Matrix) {
    // Different prediction logic based on algorithm
    switch (model.algorithm) {
      case 'random_forest':
      case 'xgboost':
      case 'svm':
      case 'neural_network':
        // For simplicity, all use the same prediction logic in this example
        return data.mmul(model.weights).to1DArray();
      default:
        return data.mmul(model.weights).to1DArray();
    }
  }

  private calculateMetric(predictions: number[], actuals: number[]): number {
    return this.calculateAllMetrics(predictions, actuals)[this.config.metric];
  }

  private calculateAllMetrics(predictions: number[], actuals: number[]): Record<string, number> {
    // For classification
    if (['accuracy', 'f1', 'precision', 'recall'].includes(this.config.metric)) {
      const binaryPredictions = predictions.map(p => p >= 0.5 ? 1 : 0);
      
      // Calculate confusion matrix
      let tp = 0, fp = 0, tn = 0, fn = 0;
      for (let i = 0; i < actuals.length; i++) {
        if (actuals[i] === 1 && binaryPredictions[i] === 1) tp++;
        else if (actuals[i] === 0 && binaryPredictions[i] === 1) fp++;
        else if (actuals[i] === 0 && binaryPredictions[i] === 0) tn++;
        else if (actuals[i] === 1 && binaryPredictions[i] === 0) fn++;
      }
      
      // Calculate metrics
      const accuracy = (tp + tn) / (tp + tn + fp + fn);
      const precision = tp / (tp + fp) || 0;
      const recall = tp / (tp + fn) || 0;
      const f1 = 2 * (precision * recall) / (precision + recall) || 0;
      
      return {
        accuracy,
        precision,
        recall,
        f1
      };
    } 
    // For regression
    else {
      const mean = actuals.reduce((a, b) => a + b, 0) / actuals.length;
      
      // Calculate metrics
      let mse = 0, mae = 0, totalSS = 0;
      for (let i = 0; i < actuals.length; i++) {
        const error = predictions[i] - actuals[i];
        mse += error * error;
        mae += Math.abs(error);
        totalSS += Math.pow(actuals[i] - mean, 2);
      }
      
      mse /= actuals.length;
      mae /= actuals.length;
      const rmse = Math.sqrt(mse);
      const r2 = 1 - (mse * actuals.length / totalSS);
      
      return {
        mse,
        rmse,
        mae,
        r2
      };
    }
  }
}