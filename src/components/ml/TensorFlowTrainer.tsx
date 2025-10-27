/**
 * TensorFlow.js Model Trainer Component
 * 
 * Train ML models directly in the browser
 * 
 * ⚠️ PREMIUM FEATURE: Requires Pro subscription
 */

import React, { useState } from 'react';
import { Dataset } from '../../types';
import { buildModel, trainModel, TrainingConfig, TrainingProgress, getModelSummary, preprocessData } from '../../lib/tensorflowClient';
import Card from '../common/Card';
import Button from '../common/Button';
import PremiumFeatureGate from '../common/PremiumFeatureGate';
import { Brain, Play, Download, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface TensorFlowTrainerProps {
  dataset: Dataset;
}

const TensorFlowTrainer: React.FC<TensorFlowTrainerProps> = ({ dataset }) => {
  const [modelType, setModelType] = useState<'regression' | 'classification'>('classification');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainedModel, setTrainedModel] = useState<any>(null);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>([]);
  const [modelSummary, setModelSummary] = useState<string>('');

  const columns = dataset.preview_data?.columns || [];

  const handleTrain = async () => {
    if (selectedFeatures.length === 0 || !targetColumn) {
      toast.error('Please select features and target column');
      return;
    }

    setIsTraining(true);
    setTrainingProgress([]);
    toast.loading('Training model...', { id: 'training' });

    try {
      // Preprocess data
      const { X, y } = preprocessData(
        dataset.preview_data?.rows || [],
        selectedFeatures,
        targetColumn
      );

      // Build model
      const model = buildModel(
        selectedFeatures.length,
        1,
        modelType
      );

      const summary = getModelSummary(model);
      setModelSummary(summary);

      // Training config
      const config: TrainingConfig = {
        modelType,
        epochs: 50,
        batchSize: 32,
        learningRate: 0.001,
        validationSplit: 0.2
      };

      // Train model
      const trained = await trainModel(
        model,
        X,
        y,
        config,
        (progress) => {
          setTrainingProgress(prev => [...prev, progress]);
        }
      );

      setTrainedModel(trained);
      toast.success('Model trained successfully!', { id: 'training' });
    } catch (error: any) {
      console.error('Training error:', error);
      toast.error(error.message || 'Training failed', { id: 'training' });
    } finally {
      setIsTraining(false);
    }
  };

  const handleDownloadModel = async () => {
    if (!trainedModel) return;
    
    try {
      await trainedModel.save(`downloads://model-${dataset.name}`);
      toast.success('Model downloaded!');
    } catch (error) {
      toast.error('Failed to download model');
    }
  };

  const latestProgress = trainingProgress[trainingProgress.length - 1];

  return (
    <PremiumFeatureGate feature="train_models">
      <div className="space-y-6">
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">TensorFlow.js Trainer</h2>
            <p className="text-sm text-gray-500">Train ML models in your browser</p>
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
            Target Column (what to predict)
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
          disabled={isTraining || selectedFeatures.length === 0 || !targetColumn}
          className="w-full"
          icon={isTraining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
        >
          {isTraining ? 'Training...' : 'Train Model'}
        </Button>
      </Card>

      {/* Training Progress */}
      {trainingProgress.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Progress</h3>
          
          {latestProgress && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Epoch</p>
                <p className="text-2xl font-bold text-gray-900">{latestProgress.epoch}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Loss</p>
                <p className="text-2xl font-bold text-red-600">{latestProgress.loss.toFixed(4)}</p>
              </div>
              {latestProgress.accuracy && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Accuracy</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(latestProgress.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
              )}
              {latestProgress.valLoss && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Val Loss</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {latestProgress.valLoss.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Progress Chart (simple) */}
          <div className="h-32 bg-gray-50 rounded-lg flex items-end justify-around p-2">
            {trainingProgress.slice(-20).map((progress, idx) => {
              const height = (1 - Math.min(progress.loss, 1)) * 100;
              return (
                <div
                  key={idx}
                  className="w-2 bg-indigo-500 rounded-t"
                  style={{ height: `${height}%` }}
                  title={`Epoch ${progress.epoch}: Loss ${progress.loss.toFixed(4)}`}
                />
              );
            })}
          </div>
        </Card>
      )}

      {/* Model Summary */}
      {trainedModel && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">Model Trained!</h3>
            </div>
            <Button
              onClick={handleDownloadModel}
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
            >
              Download Model
            </Button>
          </div>

          <pre className="bg-gray-50 p-4 rounded-lg text-xs font-mono overflow-x-auto">
            {modelSummary}
          </pre>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Next steps:</strong> You can now use this model to make predictions,
              download it for later use, or integrate it into your application!
            </p>
          </div>
        </Card>
      )}
    </div>
    </PremiumFeatureGate>
  );
};

export default TensorFlowTrainer;

