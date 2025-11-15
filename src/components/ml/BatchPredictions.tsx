import React, { useState } from 'react';
import { Upload, Download, Zap, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import AsyncTaskMonitor from './AsyncTaskMonitor';

interface PredictionInput {
  [key: string]: any;
}

interface BatchPredictionsProps {
  modelId: string;
  onPredictionsComplete?: (predictions: any[]) => void;
}

export const BatchPredictions: React.FC<BatchPredictionsProps> = ({
  modelId,
  onPredictionsComplete,
}) => {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [inputData, setInputData] = useState<PredictionInput[]>([]);
  const [jsonInput, setJsonInput] = useState('');
  const [predictions, setPredictions] = useState<any[] | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (Array.isArray(data)) {
          setInputData(data);
          setJsonInput(JSON.stringify(data, null, 2));
          toast.success(`Loaded ${data.length} records`);
        } else {
          toast.error('File must contain an array of records');
        }
      } catch (error) {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleJsonInputChange = (value: string) => {
    setJsonInput(value);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        setInputData(parsed);
      }
    } catch (error) {
      // Invalid JSON, don't update inputData
    }
  };

  const startBatchPrediction = async () => {
    if (inputData.length === 0) {
      toast.error('Please provide input data');
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch(`/api/ml/models/${modelId}/predict/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_data: inputData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start batch prediction');
      }

      const data = await response.json();
      setTaskId(data.task_id);
      toast.success(`Batch prediction started for ${data.batch_size} records`);
    } catch (error) {
      console.error('Error starting batch prediction:', error);
      toast.error('Failed to start batch prediction');
    } finally {
      setIsStarting(false);
    }
  };

  const handleComplete = (result: any) => {
    setPredictions(result.predictions || result);
    setTaskId(null);
    onPredictionsComplete?.(result.predictions || result);
  };

  const handleError = (_error: string) => {
    setTaskId(null);
  };

  const downloadPredictions = () => {
    if (!predictions) return;

    const blob = new Blob([JSON.stringify(predictions, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions_${modelId}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Predictions downloaded');
  };

  const loadSampleData = () => {
    const sample = [
      { feature1: 1.0, feature2: 2.0, feature3: 3.0 },
      { feature1: 1.5, feature2: 2.5, feature3: 3.5 },
      { feature1: 2.0, feature2: 3.0, feature3: 4.0 },
    ];
    setInputData(sample);
    setJsonInput(JSON.stringify(sample, null, 2));
    toast.success('Sample data loaded');
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      {!taskId && !predictions && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold">Batch Predictions</h3>
            </div>
            <span className="text-sm text-gray-500">{inputData.length} records</span>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload JSON File
            </label>
            <div className="flex space-x-2">
              <label className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Choose file or drag and drop
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={loadSampleData}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Load Sample
              </button>
            </div>
          </div>

          {/* JSON Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Or Enter JSON Manually
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => handleJsonInputChange(e.target.value)}
              placeholder='[{"feature1": 1.0, "feature2": 2.0}, ...]'
              rows={10}
              className="w-full px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500">
              Enter an array of objects with your feature values
            </p>
          </div>

          <button
            onClick={startBatchPrediction}
            disabled={isStarting || inputData.length === 0}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStarting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Starting Predictions...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Start Batch Prediction ({inputData.length} records)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress Monitor */}
      {taskId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-primary-600 animate-pulse" />
            <h3 className="text-lg font-semibold">Processing Predictions</h3>
          </div>

          <AsyncTaskMonitor
            taskId={taskId}
            onComplete={handleComplete}
            onError={handleError}
            pollInterval={1000}
          />

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm">
              <span className="text-gray-500">Processing:</span>
              <span className="ml-2 font-medium">{inputData.length} records</span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {predictions && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Prediction Results</h3>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={downloadPredictions}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => {
                  setPredictions(null);
                  setInputData([]);
                  setJsonInput('');
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                New Prediction
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total Predictions:</span>
              <span className="font-medium">{predictions.length}</span>
            </div>
          </div>

          {/* Results Preview */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Results Preview
            </label>
            <div className="max-h-96 overflow-auto">
              <pre className="text-xs font-mono p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto">
                {JSON.stringify(predictions.slice(0, 10), null, 2)}
                {predictions.length > 10 && '\n... and ' + (predictions.length - 10) + ' more'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchPredictions;
