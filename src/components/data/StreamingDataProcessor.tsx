import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { 
  Activity, 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Database, 
  BarChart2, 
  Save,
  Settings,
  RefreshCw,
  AlertTriangle,
  Check
} from 'lucide-react';
import Info from '../common/icons/Info';
import { Dataset } from '../../types';
import { 
  PreprocessingOptions,
  applyPreprocessingPipeline
} from '../../lib/dataProcessing';
import toast from 'react-hot-toast';
import { submitWorkload, getWorkloadStatus, cancelWorkload } from '../../lib/asyncWorkload';

interface StreamingDataProcessorProps {
  dataset?: Dataset;
  preprocessingOptions: PreprocessingOptions;
  onDataProcessed: (processedData: any[][], columns: string[]) => void;
  streamingConfig?: {
    url?: string;
    interval?: number;
    format?: 'json' | 'csv';
    apiKey?: string;
  };
}

const StreamingDataProcessor: React.FC<StreamingDataProcessorProps> = ({
  dataset,
  preprocessingOptions,
  onDataProcessed,
  streamingConfig = {}
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [streamingStats, setStreamingStats] = useState<{
    startTime: number;
    batchesProcessed: number;
    rowsProcessed: number;
    lastBatchTime?: number;
    processingRate: number;
    errorCount: number;
  }>({
    startTime: 0,
    batchesProcessed: 0,
    rowsProcessed: 0,
    processingRate: 0,
    errorCount: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({
    url: streamingConfig.url || 'https://api.example.com/stream',
    interval: streamingConfig.interval || 5000,
    format: streamingConfig.format || 'json',
    apiKey: streamingConfig.apiKey || '',
    batchSize: 100,
    maxBatches: 0, // 0 means unlimited
    simulateData: true, // For demo purposes
    useAsyncProcessing: false // Whether to use the async workload API
  });
  const [workloadId, setWorkloadId] = useState<string | null>(null);
  
  // Use refs to access current state in interval
  const configRef = useRef(config);
  const isStreamingRef = useRef(isStreaming);
  const isPausedRef = useRef(isPaused);
  const streamingStatsRef = useRef(streamingStats);
  const preprocessingOptionsRef = useRef(preprocessingOptions);
  
  // Update refs when state changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);
  
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  
  useEffect(() => {
    streamingStatsRef.current = streamingStats;
  }, [streamingStats]);
  
  useEffect(() => {
    preprocessingOptionsRef.current = preprocessingOptions;
  }, [preprocessingOptions]);
  
  // Streaming interval reference
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Start streaming
  const startStreaming = () => {
    if (!dataset?.preview_data?.columns) {
      toast.error('No dataset available for streaming simulation');
      return;
    }
    
    setIsStreaming(true);
    setIsPaused(false);
    setError(null);
    setStreamingStats({
      startTime: Date.now(),
      batchesProcessed: 0,
      rowsProcessed: 0,
      processingRate: 0,
      errorCount: 0
    });
    
    if (config.useAsyncProcessing) {
      // Set up async streaming
      startAsyncStreaming();
    } else {
      // Set up local streaming interval
      streamingIntervalRef.current = setInterval(processBatch, config.interval);
    }
    
    toast.success('Streaming started');
  };
  
  // Start async streaming
  const startAsyncStreaming = async () => {
    try {
      // Submit streaming job to async workload API
      const workload = await submitWorkload('data-processing', {
        type: 'streaming',
        datasetId: dataset?.id,
        preprocessingOptions,
        config: {
          url: config.url,
          interval: config.interval,
          format: config.format,
          batchSize: config.batchSize,
          maxBatches: config.maxBatches,
          simulateData: config.simulateData
        }
      });
      
      setWorkloadId(workload.id);
      
      // Start polling for status
      statusCheckIntervalRef.current = setInterval(async () => {
        try {
          const status = await getWorkloadStatus(workload.id);
          
          if (status.status === 'failed') {
            clearInterval(statusCheckIntervalRef.current!);
            throw new Error(status.error || 'Streaming failed');
          }
          
          if (status.status === 'completed') {
            clearInterval(statusCheckIntervalRef.current!);
            setIsStreaming(false);
            toast.success('Streaming completed');
            return;
          }
          
          // Update stats
          if (status.data && status.data.batch) {
            // Process the latest batch
            onDataProcessed(status.data.batch.data, status.data.batch.columns);
            
            // Update stats
            setStreamingStats(prev => ({
              ...prev,
              batchesProcessed: prev.batchesProcessed + 1,
              rowsProcessed: prev.rowsProcessed + status.data.batch.data.length,
              lastBatchTime: Date.now(),
              processingRate: status.data.batch.data.length / (config.interval / 1000)
            }));
          }
        } catch (error) {
          console.error('Error checking streaming status:', error);
          setError(error instanceof Error ? error.message : 'Failed to check streaming status');
          
          // Update error count
          setStreamingStats(prev => ({
            ...prev,
            errorCount: prev.errorCount + 1
          }));
          
          // Stop streaming if too many errors
          if (streamingStatsRef.current.errorCount >= 5) {
            stopStreaming();
            toast.error('Streaming stopped due to multiple errors');
          }
        }
      }, 2000);
    } catch (error) {
      console.error('Error starting async streaming:', error);
      setError(error instanceof Error ? error.message : 'Failed to start async streaming');
      setIsStreaming(false);
    }
  };
  
  // Pause streaming
  const pauseStreaming = () => {
    setIsPaused(true);
    toast.success('Streaming paused');
  };
  
  // Resume streaming
  const resumeStreaming = () => {
    setIsPaused(false);
    toast.success('Streaming resumed');
  };
  
  // Stop streaming
  const stopStreaming = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
    
    if (workloadId) {
      // Cancel async workload
      cancelAsyncStreaming(workloadId);
    }
    
    setIsStreaming(false);
    setIsPaused(false);
    setWorkloadId(null);
    toast.success('Streaming stopped');
  };
  
  // Cancel async streaming
  const cancelAsyncStreaming = async (id: string) => {
    try {
      await cancelWorkload(id);
    } catch (error) {
      console.error('Error canceling streaming workload:', error);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
      
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
      
      if (workloadId) {
        cancelAsyncStreaming(workloadId);
      }
    };
  }, [workloadId]);
  
  // Process a batch of data
  const processBatch = async () => {
    // Skip if paused
    if (isPausedRef.current) return;
    
    try {
      // Get data - either from API or simulate
      let batchData: any[][] = [];
      let columns: string[] = [];
      
      if (configRef.current.simulateData && dataset?.preview_data) {
        // Simulate data using the dataset preview
        columns = dataset.preview_data.columns;
        
        // Generate random rows based on the dataset
        const batchSize = configRef.current.batchSize;
        const datasetRows = dataset.preview_data.rows;
        
        for (let i = 0; i < batchSize; i++) {
          // Either take a random row from the dataset or modify it slightly
          if (Math.random() > 0.5 && datasetRows.length > 0) {
            const randomRowIndex = Math.floor(Math.random() * datasetRows.length);
            batchData.push([...datasetRows[randomRowIndex]]);
          } else {
            // Create a new row with random values based on column types
            const newRow: any[] = [];
            
            columns.forEach((col, colIndex) => {
              // Try to infer column type from existing data
              const existingValues = datasetRows.map(row => row[colIndex]);
              const numericValues = existingValues.filter(v => !isNaN(Number(v)));
              const isNumeric = numericValues.length > 0.8 * existingValues.length;
              
              if (isNumeric) {
                // Generate random numeric value within the range of existing values
                const min = Math.min(...numericValues.map(v => Number(v)));
                const max = Math.max(...numericValues.map(v => Number(v)));
                newRow.push((Math.random() * (max - min) + min).toFixed(2));
              } else {
                // For non-numeric, pick a random existing value
                const randomIndex = Math.floor(Math.random() * existingValues.length);
                newRow.push(existingValues[randomIndex]);
              }
            });
            
            batchData.push(newRow);
          }
        }
      } else {
        // In a real implementation, this would fetch data from the API
        // For now, we'll just simulate an error occasionally
        if (Math.random() < 0.05) {
          throw new Error('Simulated API error');
        }
        
        // Simulate API response
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use dataset columns if available
        columns = dataset?.preview_data?.columns || ['col1', 'col2', 'col3'];
        
        // Generate random data
        const batchSize = configRef.current.batchSize;
        for (let i = 0; i < batchSize; i++) {
          const row = columns.map(() => Math.random() * 100);
          batchData.push(row);
        }
      }
      
      // Apply preprocessing
      const result = applyPreprocessingPipeline(batchData, columns, preprocessingOptionsRef.current);
      
      // Send processed data to parent
      onDataProcessed(result.data, result.columns);
      
      // Update stats
      const now = Date.now();
      const newStats = {
        ...streamingStatsRef.current,
        batchesProcessed: streamingStatsRef.current.batchesProcessed + 1,
        rowsProcessed: streamingStatsRef.current.rowsProcessed + batchData.length,
        lastBatchTime: now,
        processingRate: batchData.length / (configRef.current.interval / 1000)
      };
      setStreamingStats(newStats);
      
      // Check if we've reached max batches
      if (configRef.current.maxBatches > 0 && newStats.batchesProcessed >= configRef.current.maxBatches) {
        stopStreaming();
        toast.success(`Completed ${configRef.current.maxBatches} batches`);
      }
    } catch (err) {
      console.error('Error processing batch:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Update error count
      setStreamingStats(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }));
      
      // Stop streaming if too many errors
      if (streamingStatsRef.current.errorCount >= 5) {
        stopStreaming();
        toast.error('Streaming stopped due to multiple errors');
      }
    }
  };
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes % 60}m ${seconds % 60}s`;
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <Activity className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Streaming Data Processor</h3>
            <p className="mt-1 text-xs text-gray-500">
              Process data in real-time as it arrives
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
          {!isStreaming ? (
            <Button
              onClick={startStreaming}
              icon={<Play className="w-4 h-4" />}
            >
              Start Streaming
            </Button>
          ) : isPaused ? (
            <div className="flex space-x-2">
              <Button
                onClick={resumeStreaming}
                icon={<Play className="w-4 h-4" />}
              >
                Resume
              </Button>
              <Button
                variant="outline"
                onClick={stopStreaming}
                icon={<Square className="w-4 h-4" />}
              >
                Stop
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={pauseStreaming}
                icon={<Pause className="w-4 h-4" />}
              >
                Pause
              </Button>
              <Button
                variant="outline"
                onClick={stopStreaming}
                icon={<Square className="w-4 h-4" />}
              >
                Stop
              </Button>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Streaming Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Data Source URL
              </label>
              <input
                type="text"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="https://api.example.com/stream"
                disabled={isStreaming}
              />
            </div>
            
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                API Key (if required)
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Your API key"
                disabled={isStreaming}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Polling Interval (ms)
              </label>
              <input
                type="number"
                value={config.interval}
                onChange={(e) => setConfig({ ...config, interval: Number(e.target.value) })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min={1000}
                step={1000}
                disabled={isStreaming}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Data Format
              </label>
              <select
                value={config.format}
                onChange={(e) => setConfig({ ...config, format: e.target.value as 'json' | 'csv' })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={isStreaming}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Batch Size
              </label>
              <input
                type="number"
                value={config.batchSize}
                onChange={(e) => setConfig({ ...config, batchSize: Number(e.target.value) })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min={10}
                max={1000}
                disabled={isStreaming}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Batches (0 = unlimited)
              </label>
              <input
                type="number"
                value={config.maxBatches}
                onChange={(e) => setConfig({ ...config, maxBatches: Number(e.target.value) })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min={0}
                disabled={isStreaming}
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="simulate-data"
              checked={config.simulateData}
              onChange={(e) => setConfig({ ...config, simulateData: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={isStreaming}
            />
            <label htmlFor="simulate-data" className="ml-2 block text-sm text-gray-900">
              Simulate streaming data (for demo purposes)
            </label>
          </div>
          
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="use-async-processing"
              checked={config.useAsyncProcessing}
              onChange={(e) => setConfig({ ...config, useAsyncProcessing: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={isStreaming}
            />
            <label htmlFor="use-async-processing" className="ml-2 block text-sm text-gray-900">
              Use Async Workload API for processing
            </label>
          </div>
        </div>
      )}

      {isStreaming && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-indigo-500 mr-2 animate-pulse" />
              <span className="text-sm font-medium text-gray-900">
                {isPaused ? 'Streaming Paused' : 'Streaming Active'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {formatTime(Date.now() - streamingStats.startTime)}
            </span>
          </div>
          
          {streamingStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-xs font-medium text-gray-700">Batches Processed</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {streamingStats.batchesProcessed.toLocaleString()}
                  {config.maxBatches > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      / {config.maxBatches.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-xs font-medium text-gray-700">Rows Processed</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {streamingStats.rowsProcessed.toLocaleString()}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <BarChart2 className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-xs font-medium text-gray-700">Processing Rate</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {streamingStats.processingRate.toFixed(1)} rows/sec
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-xs font-medium text-gray-700">Errors</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {streamingStats.errorCount}
                </p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error in last batch</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {workloadId && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Async Streaming</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Processing is being handled by the Async Workload API (ID: {workloadId})
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Streaming Data Processing</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This component allows you to process data in real-time as it arrives from a streaming source.
                Each batch of data is processed using the configured preprocessing options and then passed to your application.
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Data is processed in batches of {config.batchSize} rows</li>
                <li>Polling interval: {config.interval / 1000} seconds</li>
                <li>All preprocessing options are applied to each batch</li>
                <li>Results are streamed to your application in real-time</li>
                {config.useAsyncProcessing && (
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

export default StreamingDataProcessor;