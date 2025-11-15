import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskStatus {
  task_id: string;
  status: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE' | 'CANCELLED';
  meta?: {
    current_epoch?: number;
    total_epochs?: number;
    loss?: number;
    accuracy?: number;
    progress?: number;
    message?: string;
  };
  result?: any;
  error?: string;
}

interface AsyncTaskMonitorProps {
  taskId: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  pollInterval?: number;
  autoStart?: boolean;
}

export const AsyncTaskMonitor: React.FC<AsyncTaskMonitorProps> = ({
  taskId,
  onComplete,
  onError,
  pollInterval = 2000,
  autoStart = true,
}) => {
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [isPolling, setIsPolling] = useState(autoStart);

  const fetchTaskStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/ml/tasks/${taskId}`);
      if (!response.ok) throw new Error('Failed to fetch task status');
      
      const data: TaskStatus = await response.json();
      setStatus(data);

      // Handle completion
      if (data.status === 'SUCCESS') {
        setIsPolling(false);
        onComplete?.(data.result);
        toast.success('Task completed successfully!');
      } else if (data.status === 'FAILURE') {
        setIsPolling(false);
        onError?.(data.error || 'Task failed');
        toast.error(`Task failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching task status:', error);
      toast.error('Failed to fetch task status');
    }
  }, [taskId, onComplete, onError]);

  useEffect(() => {
    if (!isPolling) return;

    fetchTaskStatus();
    const interval = setInterval(fetchTaskStatus, pollInterval);

    return () => clearInterval(interval);
  }, [isPolling, fetchTaskStatus, pollInterval]);

  if (!status) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading task status...</span>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILURE':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'PROGRESS':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getProgressPercentage = () => {
    if (status.meta?.progress !== undefined) {
      return status.meta.progress;
    }
    if (status.meta?.current_epoch && status.meta?.total_epochs) {
      return (status.meta.current_epoch / status.meta.total_epochs) * 100;
    }
    return 0;
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className="space-y-3">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium capitalize">
            {status.status.toLowerCase()}
          </span>
        </div>
        <span className="text-sm text-gray-500">Task ID: {taskId.slice(0, 8)}...</span>
      </div>

      {/* Progress Bar */}
      {status.status === 'PROGRESS' && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Progress Details */}
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            {status.meta?.current_epoch && status.meta?.total_epochs && (
              <span>
                Epoch {status.meta.current_epoch} / {status.meta.total_epochs}
              </span>
            )}
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>

          {/* Metrics */}
          {(status.meta?.loss !== undefined || status.meta?.accuracy !== undefined) && (
            <div className="flex space-x-4 text-sm">
              {status.meta.loss !== undefined && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Loss:</span>
                  <span className="font-medium">{status.meta.loss.toFixed(4)}</span>
                </div>
              )}
              {status.meta.accuracy !== undefined && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Accuracy:</span>
                  <span className="font-medium">{(status.meta.accuracy * 100).toFixed(2)}%</span>
                </div>
              )}
            </div>
          )}

          {status.meta?.message && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{status.meta.message}</p>
          )}
        </div>
      )}

      {/* Success Result */}
      {status.status === 'SUCCESS' && status.result && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            Task completed successfully
          </p>
        </div>
      )}

      {/* Error Message */}
      {status.status === 'FAILURE' && status.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{status.error}</p>
        </div>
      )}
    </div>
  );
};

export default AsyncTaskMonitor;
