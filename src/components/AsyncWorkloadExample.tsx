import React, { useState, useEffect } from 'react';
import { submitWorkload, getWorkloadStatus, cancelWorkload } from '../lib/asyncWorkload';
import Button from './common/Button';
import Card from './common/Card';
import { Loader2, Check, AlertCircle } from 'lucide-react';

const AsyncWorkloadExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [workloadId, setWorkloadId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Poll for status updates when a workload is running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (workloadId && status !== 'completed' && status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const statusData = await getWorkloadStatus(workloadId);
          setStatus(statusData.status);
          setProgress(statusData.progress * 100);
          
          if (statusData.status === 'completed') {
            setResult(statusData.result);
            clearInterval(interval!);
          } else if (statusData.status === 'failed') {
            setError(statusData.error || 'Processing failed');
            clearInterval(interval!);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to check status');
          clearInterval(interval!);
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [workloadId, status]);
  
  const handleStartAsyncJob = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      // Example payload for data processing
      const workload = await submitWorkload('data-processing', {
        datasetId: 'example-dataset-id',
        preprocessingOptions: {
          missingValues: { strategy: 'impute_mean' },
          outliers: { strategy: 'cap', method: 'iqr' }
        },
        batchSize: 1000
      });
      
      setWorkloadId(workload.id);
      setStatus(workload.status);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start async job');
      setIsLoading(false);
    }
  };
  
  const handleCancelJob = async () => {
    if (!workloadId) return;
    
    try {
      await cancelWorkload(workloadId);
      setStatus('canceled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel job');
    }
  };
  
  return (
    <Card>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Async Workload Example</h2>
      
      <div className="space-y-6">
        {!workloadId ? (
          <Button 
            onClick={handleStartAsyncJob}
            disabled={isLoading}
            icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {isLoading ? 'Starting...' : 'Start Async Job'}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Workload ID</p>
                <p className="text-sm text-gray-900">{workloadId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <div className="flex items-center">
                  {status === 'running' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-1" />}
                  {status === 'completed' && <Check className="w-4 h-4 text-green-500 mr-1" />}
                  {status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500 mr-1" />}
                  <p className="text-sm text-gray-900 capitalize">{status}</p>
                </div>
              </div>
            </div>
            
            {(status === 'running' || status === 'pending') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-primary-600 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={handleCancelJob}
                  >
                    Cancel Job
                  </Button>
                </div>
              </div>
            )}
            
            {status === 'completed' && result && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 mb-2">Job Completed Successfully</h3>
                <pre className="text-xs bg-white p-3 rounded border border-green-200 overflow-auto max-h-40">
                  {JSON.stringify(result, null, 2)}
                </pre>
                
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      setWorkloadId(null);
                      setStatus(null);
                      setProgress(0);
                      setResult(null);
                    }}
                  >
                    Start New Job
                  </Button>
                </div>
              </div>
            )}
            
            {status === 'failed' && (
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Job Failed</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      setWorkloadId(null);
                      setStatus(null);
                      setProgress(0);
                      setError(null);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {error && !workloadId && (
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">How Async Processing Works</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
            <li>Submit a workload to the Async Workload API</li>
            <li>Receive a workload ID immediately</li>
            <li>Poll for status updates while the job runs in the background</li>
            <li>Process results when the job completes</li>
            <li>Handle errors if the job fails</li>
          </ol>
          <p className="mt-2 text-sm text-blue-700">
            This approach is ideal for long-running tasks that would otherwise block the UI.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AsyncWorkloadExample;