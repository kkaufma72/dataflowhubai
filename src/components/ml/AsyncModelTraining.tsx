import React, { useState } from 'react';
import { Play, Pause, X, Brain, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import AsyncTaskMonitor from './AsyncTaskMonitor';

interface TrainingConfig {
  epochs: number;
  batch_size: number;
  learning_rate: number;
  validation_split?: number;
}

interface AsyncModelTrainingProps {
  modelId: string;
  datasetId: string;
  onTrainingComplete?: (result: any) => void;
  onTrainingError?: (error: string) => void;
}

export const AsyncModelTraining: React.FC<AsyncModelTrainingProps> = ({
  modelId,
  datasetId,
  onTrainingComplete,
  onTrainingError,
}) => {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [config, setConfig] = useState<TrainingConfig>({
    epochs: 10,
    batch_size: 32,
    learning_rate: 0.001,
    validation_split: 0.2,
  });

  const startTraining = async () => {
    setIsStarting(true);
    try {
      const response = await fetch(`/api/ml/models/${modelId}/train/async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset_id: datasetId,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start training');
      }

      const data = await response.json();
      setTaskId(data.task_id);
      toast.success('Training started!');
    } catch (error) {
      console.error('Error starting training:', error);
      toast.error('Failed to start training');
    } finally {
      setIsStarting(false);
    }
  };

  const cancelTraining = async () => {
    if (!taskId) return;

    try {
      const response = await fetch(`/api/ml/tasks/${taskId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel training');
      }

      toast.success('Training cancelled');
      setTaskId(null);
    } catch (error) {
      console.error('Error cancelling training:', error);
      toast.error('Failed to cancel training');
    }
  };

  const handleComplete = (result: any) => {
    setTaskId(null);
    onTrainingComplete?.(result);
  };

  const handleError = (error: string) => {
    setTaskId(null);
    onTrainingError?.(error);
  };

  return (
    <div className="space-y-6">
      {/* Training Configuration */}
      {!taskId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold">Training Configuration</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Epochs
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={config.epochs}
                onChange={(e) => setConfig({ ...config, epochs: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Batch Size
              </label>
              <input
                type="number"
                min="1"
                max="512"
                value={config.batch_size}
                onChange={(e) => setConfig({ ...config, batch_size: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Learning Rate
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                max="1"
                value={config.learning_rate}
                onChange={(e) => setConfig({ ...config, learning_rate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Validation Split
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="0.5"
                value={config.validation_split}
                onChange={(e) => setConfig({ ...config, validation_split: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
          </div>

          <button
            onClick={startTraining}
            disabled={isStarting}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStarting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Starting Training...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Training</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Training Progress Monitor */}
      {taskId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold">Training in Progress</h3>
            </div>
            <button
              onClick={cancelTraining}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>

          <AsyncTaskMonitor
            taskId={taskId}
            onComplete={handleComplete}
            onError={handleError}
            pollInterval={2000}
          />

          {/* Training Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Model ID:</span>
                <span className="ml-2 font-medium">{modelId}</span>
              </div>
              <div>
                <span className="text-gray-500">Dataset ID:</span>
                <span className="ml-2 font-medium">{datasetId}</span>
              </div>
              <div>
                <span className="text-gray-500">Epochs:</span>
                <span className="ml-2 font-medium">{config.epochs}</span>
              </div>
              <div>
                <span className="text-gray-500">Batch Size:</span>
                <span className="ml-2 font-medium">{config.batch_size}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsyncModelTraining;
