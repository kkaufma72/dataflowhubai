/**
 * TensorFlow Docker API Client
 * 
 * Connect your existing Docker TensorFlow container to DataFlowHub
 */

export interface DockerTFConfig {
  apiUrl: string;
  apiKey?: string;
}

export interface TrainRequest {
  features: number[][];
  targets: number[];
  modelType: 'classification' | 'regression';
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
}

export interface TrainResponse {
  modelId: string;
  status: string;
  metrics: {
    loss: number;
    accuracy?: number;
    valLoss?: number;
    valAccuracy?: number;
  };
  history?: {
    loss: number[];
    accuracy?: number[];
    val_loss?: number[];
    val_accuracy?: number[];
  };
}

export interface PredictRequest {
  modelId: string;
  features: number[][];
}

export interface PredictResponse {
  predictions: number[][];
  modelId: string;
}

/**
 * TensorFlow Docker API Client
 */
export class TensorFlowDockerClient {
  private apiUrl: string;
  private apiKey?: string;

  constructor(config: DockerTFConfig) {
    // Remove trailing slash
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  /**
   * Get default headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Check if TensorFlow API is running
   */
  async healthCheck(): Promise<{ status: string; version?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`TensorFlow API unreachable: ${error.message}`);
    }
  }

  /**
   * Train a model
   */
  async train(request: TrainRequest): Promise<TrainResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/train`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          features: request.features,
          targets: request.targets,
          model_type: request.modelType,
          epochs: request.epochs || 50,
          batch_size: request.batchSize || 32,
          learning_rate: request.learningRate || 0.001,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Training failed');
      }

      const data = await response.json();
      return {
        modelId: data.model_id,
        status: data.status,
        metrics: data.metrics,
        history: data.history,
      };
    } catch (error: any) {
      throw new Error(`Training error: ${error.message}`);
    }
  }

  /**
   * Make predictions with a trained model
   */
  async predict(request: PredictRequest): Promise<PredictResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/predict`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model_id: request.modelId,
          features: request.features,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Prediction failed');
      }

      const data = await response.json();
      return {
        predictions: data.predictions,
        modelId: request.modelId,
      };
    } catch (error: any) {
      throw new Error(`Prediction error: ${error.message}`);
    }
  }

  /**
   * List all trained models
   */
  async listModels(): Promise<{ models: string[]; count: number }> {
    try {
      const response = await fetch(`${this.apiUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to list models');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`List models error: ${error.message}`);
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelId: string): Promise<{ status: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/models/${modelId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete model');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Delete model error: ${error.message}`);
    }
  }

  /**
   * Get model info
   */
  async getModelInfo(modelId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/models/${modelId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Model not found');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Get model info error: ${error.message}`);
    }
  }
}

/**
 * Create a TensorFlow Docker client instance
 */
export const createTensorFlowClient = (): TensorFlowDockerClient => {
  const apiUrl = import.meta.env.VITE_TENSORFLOW_API_URL;
  const apiKey = import.meta.env.VITE_TENSORFLOW_API_KEY;

  if (!apiUrl) {
    throw new Error(
      'VITE_TENSORFLOW_API_URL environment variable is not set. ' +
      'Add it to your .env.local file.'
    );
  }

  return new TensorFlowDockerClient({ apiUrl, apiKey });
};

export default TensorFlowDockerClient;

