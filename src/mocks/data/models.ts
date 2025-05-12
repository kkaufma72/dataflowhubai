import { MLModel } from '../../types';

export const sampleModels: MLModel[] = [
  {
    id: 'model-1',
    name: 'Customer Churn Classifier',
    description: 'Classification model to predict customer churn',
    status: 'trained',
    datasetId: 'sample-users',
    projectId: '1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    metrics: {
      accuracy: 0.85,
      precision: 0.82,
      recall: 0.79,
      f1Score: 0.80,
      auc: 0.88
    },
    hyperparameters: {
      n_estimators: 100,
      max_depth: 10,
      min_samples_split: 2
    },
    modelType: 'classification'
  },
  {
    id: 'model-2',
    name: 'Product Recommendation',
    description: 'Recommendation model for product suggestions',
    status: 'deployed',
    datasetId: 'sample-products',
    projectId: '1',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    deployedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    deploymentEndpoint: 'https://api.dataflowhub.ai/v1/models/model-2/predict',
    metrics: {
      accuracy: 0.92,
      precision: 0.90,
      recall: 0.88,
      f1Score: 0.89,
      auc: 0.94
    },
    hyperparameters: {
      learning_rate: 0.01,
      max_depth: 6,
      n_estimators: 200
    },
    modelType: 'classification'
  },
  {
    id: 'model-3',
    name: 'Sales Forecasting',
    description: 'Regression model to predict future sales',
    status: 'training',
    datasetId: 'sample-orders',
    projectId: '1',
    createdAt: new Date().toISOString(),
    modelType: 'regression'
  },
  {
    id: 'model-4',
    name: 'Customer Segmentation',
    description: 'Clustering model for customer segmentation',
    status: 'failed',
    datasetId: 'sample-users',
    projectId: '1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    modelType: 'clustering'
  }
];