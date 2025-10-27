/**
 * TensorFlow.js Client-Side ML
 * 
 * Runs TensorFlow models directly in the browser
 * No backend needed - works with Vercel static hosting
 */

import * as tf from '@tensorflow/tfjs';

export interface TrainingConfig {
  modelType: 'regression' | 'classification';
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
}

export interface TrainingProgress {
  epoch: number;
  loss: number;
  accuracy?: number;
  valLoss?: number;
  valAccuracy?: number;
}

/**
 * Build a simple neural network for classification or regression
 */
export const buildModel = (
  inputShape: number,
  outputShape: number,
  modelType: 'regression' | 'classification'
): tf.Sequential => {
  const model = tf.sequential();

  // Input layer
  model.add(tf.layers.dense({
    inputShape: [inputShape],
    units: 64,
    activation: 'relu'
  }));

  // Hidden layers
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));

  // Output layer
  if (modelType === 'classification') {
    model.add(tf.layers.dense({
      units: outputShape,
      activation: outputShape > 2 ? 'softmax' : 'sigmoid'
    }));
  } else {
    model.add(tf.layers.dense({ units: outputShape }));
  }

  return model;
};

/**
 * Train a TensorFlow.js model
 */
export const trainModel = async (
  model: tf.Sequential,
  X: number[][],
  y: number[][],
  config: TrainingConfig,
  onProgress?: (progress: TrainingProgress) => void
): Promise<tf.Sequential> => {
  
  // Convert data to tensors
  const xTensor = tf.tensor2d(X);
  const yTensor = tf.tensor2d(y);

  // Compile model
  model.compile({
    optimizer: tf.train.adam(config.learningRate),
    loss: config.modelType === 'classification' 
      ? 'categoricalCrossentropy' 
      : 'meanSquaredError',
    metrics: config.modelType === 'classification' ? ['accuracy'] : []
  });

  // Train
  await model.fit(xTensor, yTensor, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationSplit: config.validationSplit,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (onProgress && logs) {
          onProgress({
            epoch: epoch + 1,
            loss: logs.loss,
            accuracy: logs.acc,
            valLoss: logs.val_loss,
            valAccuracy: logs.val_acc
          });
        }
      }
    }
  });

  // Cleanup tensors
  xTensor.dispose();
  yTensor.dispose();

  return model;
};

/**
 * Make predictions with the trained model
 */
export const predict = async (
  model: tf.Sequential,
  X: number[][]
): Promise<number[][]> => {
  const xTensor = tf.tensor2d(X);
  const predictions = model.predict(xTensor) as tf.Tensor;
  const results = await predictions.array() as number[][];
  
  xTensor.dispose();
  predictions.dispose();
  
  return results;
};

/**
 * Save model to browser storage or download
 */
export const saveModel = async (
  model: tf.Sequential,
  name: string,
  location: 'browser' | 'download' = 'browser'
): Promise<void> => {
  if (location === 'browser') {
    await model.save(`localstorage://${name}`);
  } else {
    await model.save(`downloads://${name}`);
  }
};

/**
 * Load model from browser storage
 */
export const loadModel = async (name: string): Promise<tf.Sequential> => {
  return await tf.loadLayersModel(`localstorage://${name}`) as tf.Sequential;
};

/**
 * Get model summary as string
 */
export const getModelSummary = (model: tf.Sequential): string => {
  const lines: string[] = [];
  model.layers.forEach((layer, i) => {
    lines.push(`Layer ${i + 1}: ${layer.name}`);
    lines.push(`  Type: ${layer.getClassName()}`);
    lines.push(`  Output shape: ${layer.outputShape}`);
    lines.push(`  Parameters: ${layer.countParams()}`);
  });
  lines.push(`\nTotal parameters: ${model.countParams()}`);
  return lines.join('\n');
};

/**
 * Preprocess dataset for training
 */
export const preprocessData = (
  data: any[],
  featureColumns: string[],
  targetColumn: string
): { X: number[][], y: number[][], scaler: any } => {
  // Extract features and target
  const X = data.map(row => 
    featureColumns.map(col => parseFloat(row[col]) || 0)
  );
  
  const y = data.map(row => {
    const val = row[targetColumn];
    return typeof val === 'string' ? [val === 'yes' || val === 'true' ? 1 : 0] : [parseFloat(val) || 0];
  });

  // Simple normalization (min-max scaling)
  const scaler = {
    min: featureColumns.map((_, colIdx) => Math.min(...X.map(row => row[colIdx]))),
    max: featureColumns.map((_, colIdx) => Math.max(...X.map(row => row[colIdx])))
  };

  const XNormalized = X.map(row =>
    row.map((val, colIdx) => {
      const range = scaler.max[colIdx] - scaler.min[colIdx];
      return range === 0 ? 0 : (val - scaler.min[colIdx]) / range;
    })
  );

  return { X: XNormalized, y, scaler };
};

export default {
  buildModel,
  trainModel,
  predict,
  saveModel,
  loadModel,
  getModelSummary,
  preprocessData
};

