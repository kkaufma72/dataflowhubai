/**
 * Docker TensorFlow Trainer Component
 * 
 * Connect to your existing TensorFlow Docker container
 */

import React, { useState, useEffect } from 'react';
import { Dataset } from '../../types';
import { createTensorFlowClient, TrainResponse } from '../../lib/tensorflowDocker';
import Card from '../common/Card';
import Button from '../common/Button';
import { Brain, Play, Download, Loader2, CheckCircle, Server, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface DockerTensorFlowTrainerProps {
  dataset: Dataset;
}

const DockerTensorFlowTrainer: React.FC<DockerTensorFlowTrainerProps> = ({ dataset }) => {
  const [modelType, setModelType] = useState<'regression' | 'classification'>('classification');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainedModel, setTrainedModel] = useState<TrainResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [apiStatus, setApiStatus] = useState<string>('');

  const columns = dataset.preview_data?.columns || [];

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const client = createTensorFlowClient();
      const health = await client.healthCheck();
      setIsConnected(true);
      setApiStatus(health.version || 'Connected');
      toast.success('Connected to TensorFlow API!');
    } catch (error: any) {
      setIsConnected(false);
      setApiStatus(error.message);
      toast.error('Cannot connect to TensorFlow API');
    } finally {
      setIsChecking(false);
    }
  };

  const handleTrain = async () => {
    if (selectedFeatures.length === 0 || !targetColumn) {
      toast.error('Please select features and target column');
      return;
    }

    if (!isConnected) {
      toast.error('Not connected to TensorFlow API');
      return;
    }

    setIsTraining(true);
    toast.loading('Training model on server...', { id: 'training' });

    try {
      const client = createTensorFlowClient();

      // Prepare data
      const rows = dataset.preview_data?.rows || [];
      const features: number[][] = rows.map(row => 
        selectedFeatures.map((col, idx) => {
          const colIndex = (dataset.preview_data?.columns || []).indexOf(col);
          const value = Array.isArray(row) ? row[colIndex] : row[col];
          return parseFloat(String(value)) || 0;
        })
      );

      const targetColIndex = (dataset.preview_data?.columns || []).indexOf(targetColumn);
      const targets: number[] = rows.map(row => {
        const value = Array.isArray(row) ? row[targetColIndex] : row[targetColumn];
        // For classification, convert to 0/1
        if (modelType === 'classification') {
          if (typeof value === 'string') {
            return value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' ? 1 : 0;
          }
          return parseFloat(String(value)) > 0 ? 1 : 0;
        }
        return parseFloat(String(value)) || 0;
      });

      // Train on server
      const result = await client.train({
        features,
        targets,
        modelType,
        epochs: 50,
        batchSize: 32,
        learningRate: 0.001,
      });

      setTrainedModel(result);
      toast.success('Model trained successfully!', { id: 'training' });
    } catch (error: any) {
      console.error('Training error:', error);
      toast.error(error.message || 'Training failed', { id: 'training' });
    } finally {
      setIsTraining(false);
    }
  };

  const handlePredict = async () => {
    if (!trainedModel) return;

    try {
      const client = createTensorFlowClient();
      
      // Use first row as example
      const rows = dataset.preview_data?.rows || [];
      const exampleFeatures = [rows[0]].map(row => 
        selectedFeatures.map((col) => {
          const colIndex = (dataset.preview_data?.columns || []).indexOf(col);
          const value = Array.isArray(row) ? row[colIndex] : row[col];
          return parseFloat(String(value)) || 0;
        })
      );

      const predictions = await client.predict({
        modelId: trainedModel.modelId,
        features: exampleFeatures,
      });

      toast.success(`Prediction: ${predictions.predictions[0][0].toFixed(4)}`);
    } catch (error: any) {
      toast.error(error.message || 'Prediction failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isConnected ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Server className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Docker TensorFlow API
              </h3>
              <p className="text-sm text-gray-500">
                {isChecking ? 'Checking connection...' : apiStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium text-gray-700">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {!isConnected && !isChecking && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Cannot connect to TensorFlow API
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Make sure your Docker container is running and accessible at:
                </p>
                <code className="text-xs bg-yellow-100 px-2 py-1 rounded mt-2 inline-block">
                  {import.meta.env.VITE_TENSORFLOW_API_URL || 'Not configured'}
                </code>
                <Button
                  onClick={checkConnection}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Retry Connection
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Training Configuration */}
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Train Model (Server-Side)</h2>
            <p className="text-sm text-gray-500">GPU-accelerated training on your Docker container</p>
          </div>
        </div>

        {/* Model Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model Type
          </label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="classification">Classification</option>
            <option value="regression">Regression</option>
          </select>
        </div>

        {/* Feature Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feature Columns
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {columns.map(col => (
              <label key={col} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(col)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFeatures([...selectedFeatures, col]);
                    } else {
                      setSelectedFeatures(selectedFeatures.filter(f => f !== col));
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{col}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Selected: {selectedFeatures.length} features
          </p>
        </div>

        {/* Target Column */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Column
          </label>
          <select
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select target...</option>
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {/* Train Button */}
        <Button
          onClick={handleTrain}
          disabled={isTraining || selectedFeatures.length === 0 || !targetColumn || !isConnected}
          className="w-full"
          icon={isTraining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
        >
          {isTraining ? 'Training on Server...' : 'Train Model'}
        </Button>
      </Card>

      {/* Training Results */}
      {trainedModel && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">Model Trained!</h3>
            </div>
            <Button
              onClick={handlePredict}
              variant="outline"
              size="sm"
            >
              Test Prediction
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Model ID</p>
              <p className="text-sm font-mono font-bold text-gray-900 truncate">
                {trainedModel.modelId}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Final Loss</p>
              <p className="text-2xl font-bold text-red-600">
                {trainedModel.metrics.loss.toFixed(4)}
              </p>
            </div>
            {trainedModel.metrics.accuracy && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Accuracy</p>
                <p className="text-2xl font-bold text-green-600">
                  {(trainedModel.metrics.accuracy * 100).toFixed(1)}%
                </p>
              </div>
            )}
            {trainedModel.metrics.valLoss && (
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Val Loss</p>
                <p className="text-2xl font-bold text-orange-600">
                  {trainedModel.metrics.valLoss.toFixed(4)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Model saved on server!</strong> Use Model ID{' '}
              <code className="bg-blue-100 px-2 py-0.5 rounded">{trainedModel.modelId}</code>{' '}
              to make predictions via the API.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DockerTensorFlowTrainer;

