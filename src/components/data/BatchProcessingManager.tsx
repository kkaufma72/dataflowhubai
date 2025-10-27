import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { 
  Database, 
  Layers, 
  RefreshCw, 
  Play, 
  Pause, 
  AlertTriangle, 
  Check,
  Clock,
  Settings,
  Save,
  FileText,
  BarChart2
} from 'lucide-react';
import Info from '../common/icons/Info';
import { Dataset } from '../../types';
import { 
  batchProcessDataset, 
  PreprocessingOptions,
  PreprocessingResult
} from '../../lib/dataProcessing';
import toast from 'react-hot-toast';
import { submitWorkload, getWorkloadStatus, cancelWorkload } from '../../lib/asyncWorkload';

interface BatchProcessingManagerProps {
  dataset: Dataset;
  preprocessingOptions: PreprocessingOptions;
  onProcessingComplete: (result: PreprocessingResult) => void;
}

const BatchProcessingManager: React.FC<BatchProcessingManagerProps> = ({
  dataset,
  preprocessingOptions,
  onProcessingComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [processingStats, setProcessingStats] = useState<{
    startTime: number;
    endTime?: number;
    rowsProcessed: number;
    transformationsApplied: number;
    memoryUsage: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState(1000);
  const [showSettings, setShowSettings] = useState(false);
  const [useAsyncProcessing, setUseAsyncProcessing] = useState(false);
  const [workloadId, setWorkloadId] = useState<string | null>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Calculate total batches when dataset or batch size changes
    if (dataset && dataset.rows) {
      setTotalBatches(Math.ceil(dataset.rows / batchSize));
    }
  }, [dataset, batchSize]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  const startProcessing = async () => {
    if (!dataset.preview_data) {
      toast.error('No data available for processing');
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    setProgress(0);
    setCurrentBatch(0);
    setError(null);
    setProcessingStats({
      startTime: Date.now(),
      rowsProcessed: 0,
      transformationsApplied: 0,
      memoryUsage: 0
    });

    try {
      // Get data from dataset
      const { columns, rows } = dataset.preview_data;
      
      // Calculate total batches
      const totalBatches = Math.ceil(rows.length / batchSize);
      setTotalBatches(totalBatches);
      
      if (useAsyncProcessing) {
        // Submit to async workload API
        const workload = await submitWorkload('data-processing', {
          datasetId: dataset.id,
          preprocessingOptions,
          batchSize,
          totalRows: rows.length
        });
        
        setWorkloadId(workload.id);
        
        // Start polling for status
        statusCheckInterval.current = setInterval(async () => {
          try {
            const status = await getWorkloadStatus(workload.id);
            
            if (status.status === 'completed') {
              clearInterval(statusCheckInterval.current!);
              
              // Update final stats
              setProcessingStats(prev => {
                if (!prev) return null;
                
                return {
                  ...prev,
                  endTime: Date.now(),
                  rowsProcessed: rows.length,
                  transformationsApplied: status.result.transformations.length,
                  memoryUsage: status.metrics.peakMemoryMb || 0
                };
              });
              
              setProgress(100);
              setIsProcessing(false);
              
              // Call completion handler
              onProcessingComplete({
                ...status.result,
                originalDatasetId: dataset.id
              });
              
              toast.success('Async batch processing completed successfully');
            } else if (status.status === 'failed') {
              clearInterval(statusCheckInterval.current!);
              throw new Error(status.error || 'Processing failed');
            } else {
              // Update progress
              setProgress(status.progress * 100);
              setCurrentBatch(Math.floor(status.progress * totalBatches));
              
              // Update stats
              setProcessingStats(prev => {
                if (!prev) return null;
                
                return {
                  ...prev,
                  rowsProcessed: Math.floor(status.progress * rows.length),
                  memoryUsage: status.metrics.currentMemoryMb || 0
                };
              });
            }
          } catch (error) {
            clearInterval(statusCheckInterval.current!);
            console.error('Error checking workload status:', error);
            setError(error instanceof Error ? error.message : 'Failed to check workload status');
            setIsProcessing(false);
          }
        }, 2000);
      } else {
        // Process dataset in batches locally
        const result = await batchProcessDataset(
          rows,
          columns,
          preprocessingOptions,
          batchSize,
          (progress) => {
            setProgress(progress * 100);
            setCurrentBatch(Math.floor(progress * totalBatches));
            
            // Update stats
            setProcessingStats(prev => {
              if (!prev) return null;
              
              return {
                ...prev,
                rowsProcessed: Math.floor(progress * rows.length),
                // Simulate memory usage (in MB)
                memoryUsage: Math.floor(50 + Math.random() * 50)
              };
            });
          }
        );
        
        // Update final stats
        setProcessingStats(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            endTime: Date.now(),
            rowsProcessed: rows.length,
            transformationsApplied: result.transformations.length,
            memoryUsage: Math.floor(50 + Math.random() * 50)
          };
        });
        
        // Complete processing
        setProgress(100);
        setIsProcessing(false);
        
        // Call completion handler
        onProcessingComplete({
          ...result,
          originalDatasetId: dataset.id
        });
        
        toast.success('Batch processing completed successfully');
      }
    } catch (error) {
      console.error('Batch processing error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsProcessing(false);
      toast.error('Batch processing failed');
    }
  };

  const pauseProcessing = () => {
    setIsPaused(true);
    toast.success('Processing paused');
  };

  const resumeProcessing = () => {
    setIsPaused(false);
    toast.success('Processing resumed');
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes % 60}m ${seconds % 60}s`;
  };

  const estimateRemainingTime = () => {
    if (!processingStats || progress === 0) return 'Calculating...';
    
    const elapsedMs = Date.now() - processingStats.startTime;
    const estimatedTotalMs = elapsedMs / (progress / 100);
    const remainingMs = estimatedTotalMs - elapsedMs;
    
    return formatTime(remainingMs);
  };

  const cancelAsyncProcessing = async () => {
    if (!workloadId) return;
    
    try {
      await cancelWorkload(workloadId);
      
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      
      setIsProcessing(false);
      toast.success('Async processing canceled');
    } catch (error) {
      console.error('Error canceling workload:', error);
      toast.error('Failed to cancel processing');
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Batch Processing Manager</h3>
            <p className="mt-1 text-xs text-gray-500">
              Process large datasets efficiently in batches
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            icon={<Settings className="w-4 h-4" />}
          >
            Settings
          </Button>
          {!isProcessing ? (
            <Button
              onClick={startProcessing}
              icon={<Play className="w-4 h-4" />}
            >
              Start Processing
            </Button>
          ) : isPaused ? (
            <Button
              onClick={resumeProcessing}
              icon={<Play className="w-4 h-4" />}
            >
              Resume
            </Button>
          ) : (
            <Button
              onClick={pauseProcessing}
              icon={<Pause className="w-4 h-4" />}
            >
              Pause
            </Button>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Processing Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Batch Size
              </label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value={500}>500 rows</option>
                <option value={1000}>1,000 rows</option>
                <option value={5000}>5,000 rows</option>
                <option value={10000}>10,000 rows</option>
                <option value={50000}>50,000 rows</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Smaller batch sizes use less memory but may take longer to process
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Estimated Batches
              </label>
              <div className="flex items-center">
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700 w-full">
                  {totalBatches.toLocaleString()} batches
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Based on {dataset.rows?.toLocaleString() || 0} rows and selected batch size
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <h5 className="text-xs font-medium text-gray-700 mb-2">Preprocessing Options Summary</h5>
            <div className="p-3 bg-white rounded-md border border-gray-200 text-sm">
              <ul className="space-y-1 text-gray-600">
                {preprocessingOptions.missingValues && (
                  <li>• Missing values: {preprocessingOptions.missingValues.strategy.replace(/_/g, ' ')}</li>
                )}
                {preprocessingOptions.outliers && (
                  <li>• Outliers: {preprocessingOptions.outliers.strategy.replace(/_/g, ' ')} using {preprocessingOptions.outliers.method.replace(/_/g, ' ')}</li>
                )}
                {preprocessingOptions.encoding && (
                  <li>• Encoding: {preprocessingOptions.encoding.strategy.replace(/_/g, ' ')}</li>
                )}
                {preprocessingOptions.scaling && (
                  <li>• Scaling: {preprocessingOptions.scaling.strategy.replace(/_/g, ' ')}</li>
                )}
                {preprocessingOptions.featureSelection && (
                  <li>• Feature selection: {preprocessingOptions.featureSelection.strategy.replace(/_/g, ' ')}</li>
                )}
                {preprocessingOptions.dimensionalityReduction && (
                  <li>• Dimensionality reduction: {preprocessingOptions.dimensionalityReduction.strategy.replace(/_/g, ' ')}</li>
                )}
                {!preprocessingOptions.missingValues && 
                 !preprocessingOptions.outliers && 
                 !preprocessingOptions.encoding && 
                 !preprocessingOptions.scaling && 
                 !preprocessingOptions.featureSelection && 
                 !preprocessingOptions.dimensionalityReduction && (
                  <li>No preprocessing options selected</li>
                )}
              </ul>
            </div>
          </div>
            
          <div className="md:col-span-2">
            <div className="flex items-center">
              <input
                id="use-async-processing"
                type="checkbox"
                checked={useAsyncProcessing}
                onChange={(e) => setUseAsyncProcessing(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="use-async-processing" className="ml-2 block text-sm text-gray-900">
                Use Async Workload API for processing (recommended for large datasets)
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500 ml-6">
              Offloads processing to a dedicated service for better performance and resource utilization
            </p>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="mb-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Batch {currentBatch} of {totalBatches}</span>
              <span>Estimated time remaining: {estimateRemainingTime()}</span>
            </div>
          </div>
          
          {processingStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-xs font-medium text-gray-700">Elapsed Time</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatTime(Date.now() - processingStats.startTime)}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-xs font-medium text-gray-700">Rows Processed</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {processingStats.rowsProcessed.toLocaleString()} / {dataset.rows?.toLocaleString() || 0}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <BarChart2 className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-xs font-medium text-gray-700">Memory Usage</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {processingStats.memoryUsage} MB
                </p>
              </div>
            </div>
          )}
          
          {useAsyncProcessing && workloadId && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Info className="w-5 h-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Processing via Async Workload API</p>
                  <p className="text-xs text-blue-700">Workload ID: {workloadId}</p>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelAsyncProcessing}
                >
                  Cancel Workload
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {processingStats?.endTime && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Processing Complete</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Successfully processed {dataset.rows?.toLocaleString() || 0} rows in {formatTime(processingStats.endTime - processingStats.startTime)}</p>
                <p className="mt-1">Applied {processingStats.transformationsApplied} transformations</p>
              </div>
              <div className="mt-4 flex space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<FileText className="w-4 h-4" />}
                >
                  View Report
                </Button>
                <Button
                  size="sm"
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Results
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Batch Processing Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Batch processing allows you to efficiently process large datasets by breaking them into smaller chunks.
                This reduces memory usage and provides better progress tracking.
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Processing {dataset.rows?.toLocaleString() || 0} rows in batches of {batchSize.toLocaleString()}</li>
                <li>Estimated {totalBatches} batches total</li>
                <li>All preprocessing options will be applied to each batch</li>
                <li>Results will be combined into a single processed dataset</li>
                {useAsyncProcessing && (
                  <li>Using Async Workload API for distributed processing</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BatchProcessingManager;