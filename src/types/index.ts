export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  rows: number;
  columns: number;
  dateUploaded: string;
  fileType: string;
  fileSize: string;
  projectId?: string | null;
  preview_data?: {  // Changed from previewData
    columns: string[];
    rows: string[][];
  };
  version?: string;
  parentDatasetId?: string;
  quality?: {
    score: number;
    lastChecked: string;
    issues: number;
  };
  lineage?: {
    source: string;
    transformations: string[];
    derivedDatasets: string[];
  };
}

export interface DatasetVersion {
  id: string;
  datasetId: string;
  version: string;
  createdAt: string;
  createdBy: string;
  description: string;
  changes: string[];
  metadata: {
    rowCount: number;
    columnCount: number;
    fileSize: string;
    hash: string;
  };
}

export interface DataQualityRule {
  id: string;
  name: string;
  description: string;
  type: 'completeness' | 'uniqueness' | 'consistency' | 'accuracy' | 'timeliness' | 'custom';
  column: string;
  condition: string;
  severity: 'info' | 'warning' | 'error';
  enabled: boolean;
}

export interface DataQualityCheckResult {
  ruleId: string;
  passed: boolean;
  message: string;
  affectedRows: number;
  timestamp: string;
}

export interface DataLineageNode {
  id: string;
  type: 'dataset' | 'transformation' | 'source' | 'destination';
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface DataLineageEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface PreprocessingStep {
  id: string;
  name: string;
  type: 'missing_values' | 'outliers' | 'encoding' | 'scaling' | 'feature_selection' | 'custom';
  config: Record<string, any>;
  enabled: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: {
    affectedRows: number;
    affectedColumns: string[];
    message: string;
  };
}

export interface MLModel {
  id: string;
  name: string;
  description: string;
  status: 'training' | 'trained' | 'failed' | 'deployed';
  datasetId: string;
  projectId?: string | null;
  createdAt: string;
  metrics?: Record<string, number>;
  hyperparameters?: Record<string, number | string | boolean>;
  deploymentEndpoint?: string;
  deployedAt?: string;
  modelType?: string;
  version?: string;
  parentModelId?: string;
}

export interface ModelTrainingConfig {
  datasetId: string;
  targetVariable: string;
  modelType: string;
  trainTestSplit: number;
  hyperparameterTuning: boolean;
  optimizationMetric: string;
  algorithms: string[];
  customParameters?: Record<string, any>;
  crossValidation?: {
    enabled: boolean;
    folds: number;
    stratified: boolean;
  };
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface DeploymentConfig {
  modelId: string;
  endpoint: string;
  scalingOptions: {
    minInstances: number;
    maxInstances: number;
  };
  authentication: 'api_key' | 'oauth' | 'none';
}

export interface ModelMonitoring {
  modelId: string;
  performance: {
    timestamp: string;
    metrics: Record<string, number>;
  }[];
  predictionCount: number;
  lastUpdated: string;
  driftDetected: boolean;
}

export interface ModelVersion {
  id: string;
  modelId: string;
  version: string;
  createdAt: string;
  metrics?: Record<string, number>;
  hyperparameters?: Record<string, any>;
  changes: string[];
}

export interface CrossValidationResult {
  fold: number;
  trainIndices: number[];
  testIndices: number[];
  metrics: Record<string, number>;
}

export interface ModelExportFormat {
  type: 'zip' | 'json' | 'onnx' | 'pickle';
  includeCode: boolean;
  includeSampleData: boolean;
}

export interface ModelImportResult {
  success: boolean;
  model?: MLModel;
  error?: string;
}

export interface AlgorithmConfig {
  id: string;
  name: string;
  hyperparameters: Record<string, any>;
}

export interface PipelineNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
}

export interface PipelineConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceOutput: string;
  targetInput: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  nodes: PipelineNode[];
  connections: PipelineConnection[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'archived';
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'doughnut';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }[];
  };
  options?: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  charts: {
    id: string;
    title: string;
    config: ChartConfig;
    position: { x: number; y: number; w: number; h: number };
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
    twoFactorAuth: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
