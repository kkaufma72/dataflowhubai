import * as tf from '@tensorflow/tfjs';
import { Matrix } from 'ml-matrix';
import { v4 as uuidv4 } from 'uuid';

export interface AutoMLConfig {
  targetColumn: string;
  featureColumns: string[];
  modelType: 'classification' | 'regression';
  optimizationMetric: string;
  maxTrials: number;
  validationSplit: number;
  algorithms: string[];
  crossValidation?: {
    enabled: boolean;
    folds: number;
    stratified: boolean;
  };
}

export interface ModelArchitecture {
  type: string;
  layers?: number[];
  activations?: string[];
  learningRate?: number;
  optimizer?: string;
  hyperparameters?: Record<string, any>;
}

export interface CrossValidationResult {
  fold: number;
  trainIndices: number[];
  testIndices: number[];
  metrics: Record<string, number>;
}

export class AutoMLEngine {
  private data: any[];
  private config: AutoMLConfig;
  private bestModel: tf.LayersModel | null = null;
  private bestScore: number = -Infinity;
  private trials: Array<{id: string; architecture: ModelArchitecture; score: number}> = [];
  private crossValidationResults: CrossValidationResult[] = [];

  constructor(data: any[], config: AutoMLConfig) {
    this.data = data;
    this.config = config;
  }

  async train(): Promise<{
    model: tf.LayersModel;
    score: number;
    trials: Array<{id: string; architecture: ModelArchitecture; score: number}>;
    featureImportance: {feature: string; importance: number}[];
    crossValidationResults: CrossValidationResult[];
  }> {
    const { X, y } = this.preprocessData();
    const architectures = this.generateArchitectures();
    
    // Perform cross-validation if enabled
    if (this.config.crossValidation?.enabled) {
      await this.performCrossValidation(X, y);
    }
    
    for (const architecture of architectures) {
      const model = this.buildModel(architecture);
      const score = await this.evaluateModel(model, X, y);
      
      this.trials.push({
        id: uuidv4(),
        architecture,
        score
      });

      if (score > this.bestScore) {
        this.bestScore = score;
        this.bestModel = model;
      }
    }

    const featureImportance = await this.calculateFeatureImportance(X, y);

    return {
      model: this.bestModel!,
      score: this.bestScore,
      trials: this.trials,
      featureImportance,
      crossValidationResults: this.crossValidationResults
    };
  }

  private preprocessData() {
    // Extract features and target
    const X = this.data.map(row => 
      this.config.featureColumns.map(col => row[col])
    );
    const y = this.data.map(row => row[this.config.targetColumn]);

    // Convert to tensors
    const tensorX = tf.tensor2d(X);
    const tensorY = tf.tensor1d(y);

    return { X: tensorX, y: tensorY };
  }

  private generateArchitectures(): ModelArchitecture[] {
    const architectures: ModelArchitecture[] = [];
    const inputDim = this.config.featureColumns.length;

    // Only generate architectures for selected algorithms
    if (this.config.algorithms.includes('random_forest')) {
      architectures.push({
        type: 'random_forest',
        hyperparameters: {
          n_estimators: Math.floor(Math.random() * 150) + 50,
          max_depth: Math.floor(Math.random() * 15) + 5,
          min_samples_split: Math.floor(Math.random() * 10) + 2,
        }
      });
    }

    if (this.config.algorithms.includes('xgboost')) {
      architectures.push({
        type: 'xgboost',
        hyperparameters: {
          learning_rate: Math.random() * 0.2 + 0.01,
          max_depth: Math.floor(Math.random() * 10) + 3,
          n_estimators: Math.floor(Math.random() * 200) + 50,
        }
      });
    }

    if (this.config.algorithms.includes('neural_network')) {
      // Generate different network architectures
      const layerConfigurations = [
        [inputDim * 2],
        [inputDim * 2, inputDim],
        [inputDim * 3, inputDim * 2, inputDim],
      ];

      const activations = ['relu', 'tanh', 'sigmoid'];
      const learningRates = [0.001, 0.01, 0.1];
      const optimizers = ['adam', 'rmsprop', 'sgd'];

      for (const layers of layerConfigurations) {
        for (const activation of activations) {
          for (const learningRate of learningRates) {
            for (const optimizer of optimizers) {
              architectures.push({
                type: 'neural_network',
                layers,
                activations: Array(layers.length).fill(activation),
                learningRate,
                optimizer
              });
            }
          }
        }
      }
    }

    if (this.config.algorithms.includes('svm')) {
      const kernels = ['linear', 'rbf', 'poly'];
      const Cs = [0.1, 1, 10];
      const gammas = ['scale', 'auto'];

      for (const kernel of kernels) {
        for (const C of Cs) {
          for (const gamma of gammas) {
            architectures.push({
              type: 'svm',
              hyperparameters: {
                kernel,
                C,
                gamma
              }
            });
          }
        }
      }
    }

    if (this.config.algorithms.includes('ensemble')) {
      architectures.push({
        type: 'ensemble',
        hyperparameters: {
          voting: 'soft',
          weights: 'uniform',
          use_probabilities: true
        }
      });
    }

    // Limit the number of architectures to maxTrials
    return architectures.slice(0, this.config.maxTrials);
  }

  private buildModel(architecture: ModelArchitecture): tf.LayersModel {
    if (architecture.type === 'neural_network') {
      const model = tf.sequential();
      
      architecture.layers?.forEach((units, i) => {
        model.add(tf.layers.dense({
          units,
          activation: architecture.activations?.[i],
          inputShape: i === 0 ? [this.config.featureColumns.length] : undefined
        }));
      });

      // Add output layer
      model.add(tf.layers.dense({
        units: this.config.modelType === 'classification' ? 1 : 1,
        activation: this.config.modelType === 'classification' ? 'sigmoid' : 'linear'
      }));

      model.compile({
        optimizer: tf.train.adam(architecture.learningRate),
        loss: this.config.modelType === 'classification' ? 'binaryCrossentropy' : 'meanSquaredError',
        metrics: ['accuracy']
      });

      return model;
    } else {
      // For non-neural network models, create a placeholder model
      // In a real implementation, this would use the appropriate algorithm
      const model = tf.sequential();
      model.add(tf.layers.dense({
        units: 1,
        activation: this.config.modelType === 'classification' ? 'sigmoid' : 'linear',
        inputShape: [this.config.featureColumns.length]
      }));
      
      model.compile({
        optimizer: 'adam',
        loss: this.config.modelType === 'classification' ? 'binaryCrossentropy' : 'meanSquaredError',
        metrics: ['accuracy']
      });
      
      return model;
    }
  }

  private async evaluateModel(model: tf.LayersModel, X: tf.Tensor2D, y: tf.Tensor1D): Promise<number> {
    const validationSplit = this.config.validationSplit;
    const splitIndex = Math.floor(X.shape[0] * (1 - validationSplit));
    
    const trainX = X.slice([0, 0], [splitIndex, -1]);
    const trainY = y.slice([0], [splitIndex]);
    const valX = X.slice([splitIndex, 0], [-1, -1]);
    const valY = y.slice([splitIndex], [-1]);

    await model.fit(trainX, trainY, {
      epochs: 50,
      batchSize: 32,
      validationData: [valX, valY],
      verbose: 0
    });

    const evaluation = await model.evaluate(valX, valY) as tf.Scalar[];
    return evaluation[1].dataSync()[0]; // Return validation accuracy
  }

  private async performCrossValidation(X: tf.Tensor2D, y: tf.Tensor1D) {
    const folds = this.config.crossValidation?.folds || 5;
    const numSamples = X.shape[0];
    const indices = Array.from({ length: numSamples }, (_, i) => i);
    
    // Shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Create folds
    const foldSize = Math.floor(numSamples / folds);
    
    for (let fold = 0; fold < folds; fold++) {
      const testIndices = indices.slice(fold * foldSize, (fold + 1) * foldSize);
      const trainIndices = indices.filter(i => !testIndices.includes(i));
      
      // Create train/test split
      const trainX = tf.gather(X, trainIndices);
      const trainY = tf.gather(y, trainIndices);
      const testX = tf.gather(X, testIndices);
      const testY = tf.gather(y, testIndices);
      
      // Train a simple model for this fold
      const model = tf.sequential();
      model.add(tf.layers.dense({
        units: 10,
        activation: 'relu',
        inputShape: [this.config.featureColumns.length]
      }));
      model.add(tf.layers.dense({
        units: this.config.modelType === 'classification' ? 1 : 1,
        activation: this.config.modelType === 'classification' ? 'sigmoid' : 'linear'
      }));
      
      model.compile({
        optimizer: 'adam',
        loss: this.config.modelType === 'classification' ? 'binaryCrossentropy' : 'meanSquaredError',
        metrics: ['accuracy']
      });
      
      await model.fit(trainX, trainY, {
        epochs: 20,
        batchSize: 32,
        verbose: 0
      });
      
      // Evaluate
      const evaluation = await model.evaluate(testX, testY) as tf.Scalar[];
      const accuracy = evaluation[1].dataSync()[0];
      
      // Calculate additional metrics
      const predictions = model.predict(testX) as tf.Tensor;
      const predArray = await predictions.array() as number[][];
      const actualArray = await testY.array() as number[];
      
      const metrics = this.calculateMetrics(predArray.flat(), actualArray);
      
      this.crossValidationResults.push({
        fold: fold + 1,
        trainIndices,
        testIndices,
        metrics: {
          accuracy,
          ...metrics
        }
      });
      
      // Clean up tensors
      trainX.dispose();
      trainY.dispose();
      testX.dispose();
      testY.dispose();
      predictions.dispose();
      model.dispose();
    }
  }

  private calculateMetrics(predictions: number[], actuals: number[]): Record<string, number> {
    if (this.config.modelType === 'classification') {
      // Convert predictions to binary (0 or 1)
      const binaryPredictions = predictions.map(p => p >= 0.5 ? 1 : 0);
      
      // Calculate true positives, false positives, true negatives, false negatives
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
      const f1Score = 2 * precision * recall / (precision + recall) || 0;
      
      return {
        accuracy,
        precision,
        recall,
        f1Score
      };
    } else {
      // Regression metrics
      const mean = actuals.reduce((a, b) => a + b, 0) / actuals.length;
      
      // Calculate MSE, RMSE, MAE, R²
      let mse = 0, mae = 0, totalSS = 0;
      
      for (let i = 0; i < actuals.length; i++) {
        const error = actuals[i] - predictions[i];
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

  private async calculateFeatureImportance(X: tf.Tensor2D, y: tf.Tensor1D) {
    if (!this.bestModel) throw new Error('No model trained yet');

    const baselinePredictions = this.bestModel.predict(X) as tf.Tensor;
    const baselineScore = await this.calculateScore(baselinePredictions, y);
    const importance: {feature: string; importance: number}[] = [];

    // Calculate feature importance using permutation importance
    for (let i = 0; i < this.config.featureColumns.length; i++) {
      const permutedX = X.clone();
      const column = permutedX.slice([0, i], [-1, 1]);
      const shuffled = tf.randomShuffle(column);
      permutedX.slice([0, i], [-1, 1]).assign(shuffled);

      const permutedPredictions = this.bestModel.predict(permutedX) as tf.Tensor;
      const permutedScore = await this.calculateScore(permutedPredictions, y);
      
      importance.push({
        feature: this.config.featureColumns[i],
        importance: Math.abs(baselineScore - permutedScore)
      });
    }

    return importance.sort((a, b) => b.importance - a.importance);
  }

  private async calculateScore(predictions: tf.Tensor, actual: tf.Tensor1D): Promise<number> {
    const predArray = await predictions.array();
    const actualArray = await actual.array();
    
    if (this.config.modelType === 'classification') {
      // Calculate accuracy
      const correct = predArray.filter((pred, i) => 
        Math.round(pred) === actualArray[i]
      ).length;
      return correct / predArray.length;
    } else {
      // Calculate R-squared
      const mean = actualArray.reduce((a, b) => a + b) / actualArray.length;
      const totalSS = actualArray.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
      const residualSS = actualArray.reduce((a, b, i) => a + Math.pow(b - predArray[i], 2), 0);
      return 1 - (residualSS / totalSS);
    }
  }
}