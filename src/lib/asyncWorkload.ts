/**
 * Async Workload API client
 * 
 * This module provides functions to interact with the Async Workload API
 * for processing large-scale data operations and model training tasks.
 */

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_ASYNC_WORKLOAD_API_KEY;
const API_BASE_URL = 'https://api.asyncworkload.com/v1';

/**
 * Submit a new workload to the async processing queue
 * 
 * @param workloadType - Type of workload (e.g., 'data-processing', 'model-training')
 * @param payload - Workload configuration and data
 * @returns Promise with the workload ID and status
 */
export const submitWorkload = async (
  workloadType: 'data-processing' | 'model-training' | 'batch-prediction',
  payload: Record<string, any>
): Promise<{
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  createdAt: string;
}> => {
  // For demo purposes, simulate API call
  console.log(`Submitting ${workloadType} workload:`, payload);
  
  // Simulate API response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    id: `wl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
};

/**
 * Get the status of a workload
 * 
 * @param workloadId - ID of the workload to check
 * @returns Promise with the workload status and results (if completed)
 */
export const getWorkloadStatus = async (workloadId: string): Promise<{
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  progress: number;
  result?: any;
  error?: string;
  metrics?: {
    startTime: string;
    endTime?: string;
    duration?: number;
    currentMemoryMb?: number;
    peakMemoryMb?: number;
  };
  data?: any;
}> => {
  // For demo purposes, simulate API call
  console.log(`Checking status for workload: ${workloadId}`);
  
  // Simulate API response
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Extract timestamp from workload ID to calculate progress
  const timestamp = parseInt(workloadId.split('-')[1]);
  const elapsedMs = Date.now() - timestamp;
  const progress = Math.min(elapsedMs / 20000, 1); // Complete in ~20 seconds
  
  // Simulate different statuses based on progress
  let status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled' = 'running';
  let result = undefined;
  let error = undefined;
  
  if (progress < 0.1) {
    status = 'pending';
  } else if (progress >= 1) {
    status = 'completed';
    result = {
      transformations: [
        { type: 'missing_values', affectedColumns: 5, affectedRows: 120 },
        { type: 'outliers', affectedColumns: 3, affectedRows: 45 },
        { type: 'scaling', affectedColumns: 8, affectedRows: 1000 }
      ],
      data: Array(10).fill(0).map(() => Array(5).fill(0).map(() => Math.random())),
      columns: ['col1', 'col2', 'col3', 'col4', 'col5']
    };
  } else if (Math.random() < 0.05) {
    // 5% chance of failure for demo purposes
    status = 'failed';
    error = 'Simulated processing error';
  }
  
  // For streaming data processor, include batch data
  const data = workloadId.includes('streaming') ? {
    batch: {
      data: Array(10).fill(0).map(() => Array(5).fill(0).map(() => Math.random())),
      columns: ['col1', 'col2', 'col3', 'col4', 'col5']
    }
  } : undefined;
  
  return {
    id: workloadId,
    status,
    progress,
    result,
    error,
    metrics: {
      startTime: new Date(timestamp).toISOString(),
      endTime: status === 'completed' ? new Date().toISOString() : undefined,
      duration: elapsedMs,
      currentMemoryMb: 120 + Math.random() * 50,
      peakMemoryMb: 200 + Math.random() * 100
    },
    data
  };
};

/**
 * Cancel a running workload
 * 
 * @param workloadId - ID of the workload to cancel
 * @returns Promise with the cancellation result
 */
export const cancelWorkload = async (workloadId: string): Promise<{
  id: string;
  status: 'canceled';
  message: string;
}> => {
  // For demo purposes, simulate API call
  console.log(`Canceling workload: ${workloadId}`);
  
  // Simulate API response
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    id: workloadId,
    status: 'canceled',
    message: 'Workload canceled successfully'
  };
};

/**
 * List all workloads for the current account
 * 
 * @param status - Optional filter by status
 * @param limit - Maximum number of workloads to return
 * @returns Promise with the list of workloads
 */
export const listWorkloads = async (
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'canceled',
  limit: number = 10
): Promise<{
  workloads: Array<{
    id: string;
    type: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
    progress: number;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
}> => {
  // For demo purposes, simulate API call
  console.log(`Listing workloads with status: ${status}, limit: ${limit}`);
  
  // Simulate API response
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate random workloads
  const workloads = Array(Math.min(limit, 5)).fill(0).map((_, i) => {
    const createdAt = new Date(Date.now() - Math.random() * 86400000 * 7); // Within last week
    return {
      id: `wl-${createdAt.getTime()}-${Math.random().toString(36).substring(2, 7)}`,
      type: ['data-processing', 'model-training', 'batch-prediction'][Math.floor(Math.random() * 3)],
      status: ['pending', 'running', 'completed', 'failed', 'canceled'][
        status ? ['pending', 'running', 'completed', 'failed', 'canceled'].indexOf(status) : Math.floor(Math.random() * 5)
      ] as 'pending' | 'running' | 'completed' | 'failed' | 'canceled',
      progress: Math.random(),
      createdAt: createdAt.toISOString(),
      updatedAt: new Date(createdAt.getTime() + Math.random() * 3600000).toISOString()
    };
  });
  
  return {
    workloads,
    total: 25 // Simulate more workloads available
  };
};

export default {
  submitWorkload,
  getWorkloadStatus,
  cancelWorkload,
  listWorkloads
};