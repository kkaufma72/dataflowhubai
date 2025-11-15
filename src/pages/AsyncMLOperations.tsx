import React, { useState } from 'react';
import { Brain, Zap, Activity } from 'lucide-react';
import AsyncModelTraining from '../components/ml/AsyncModelTraining';
import BatchPredictions from '../components/ml/BatchPredictions';
import ActiveTasksPanel from '../components/ml/ActiveTasksPanel';

type TabType = 'training' | 'predictions' | 'monitoring';

export const AsyncMLOperations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('training');
  const [modelId] = useState('model-' + Date.now());
  const [datasetId] = useState('dataset-' + Date.now());

  const tabs = [
    { id: 'training' as TabType, label: 'Model Training', icon: Brain },
    { id: 'predictions' as TabType, label: 'Batch Predictions', icon: Zap },
    { id: 'monitoring' as TabType, label: 'Task Monitoring', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Async ML Operations
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Run ML tasks in the background with real-time progress tracking
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Celery Active
                </span>
              </div>
              <a
                href="http://localhost:5555"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                Open Flower →
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex space-x-1 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'training' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                About Async Training
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Train ML models in the background without blocking the UI. Track progress in
                real-time with epoch-by-epoch metrics. Training continues even if you navigate away.
              </p>
            </div>

            <AsyncModelTraining
              modelId={modelId}
              datasetId={datasetId}
              onTrainingComplete={(result) => {
                console.log('Training complete:', result);
              }}
              onTrainingError={(error) => {
                console.error('Training error:', error);
              }}
            />
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-1">
                About Batch Predictions
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Process large batches of predictions asynchronously. Upload JSON files or paste
                data directly. Results are automatically saved and can be downloaded.
              </p>
            </div>

            <BatchPredictions
              modelId={modelId}
              onPredictionsComplete={(predictions) => {
                console.log('Predictions complete:', predictions);
              }}
            />
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 dark:text-green-200 mb-1">
                Task Monitoring
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Monitor all active, scheduled, and reserved tasks across all Celery workers.
                Auto-refreshes every 5 seconds. For detailed monitoring, use the Flower dashboard.
              </p>
            </div>

            <ActiveTasksPanel />

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Scheduled Tasks</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Model Drift Check</span>
                    <span className="font-medium">Every hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Data Quality Check</span>
                    <span className="font-medium">Every 6 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cleanup Old Predictions</span>
                    <span className="font-medium">Daily at 2 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Daily Metrics Report</span>
                    <span className="font-medium">Daily at 8 AM</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Available Tasks</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🎓</span>
                    <span>Model Training & Evaluation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🔮</span>
                    <span>Batch Predictions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🔍</span>
                    <span>Data Quality Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">📊</span>
                    <span>Model Drift Detection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💚</span>
                    <span>System Health Monitoring</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🧹</span>
                    <span>Automated Cleanup</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsyncMLOperations;
