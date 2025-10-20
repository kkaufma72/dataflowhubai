// src/lib/asyncWorkload.ts

import { supabase } from './supabase';

export interface AsyncWorkload {
  id: string;
  user_id: string;
  project_id: string;
  type: 'model_training' | 'data_processing' | 'batch_prediction' | 'feature_engineering';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_steps: number;
  current_step: number;
  step_description?: string;
  config: any;
  result?: any;
  error?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  estimated_completion?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface WorkloadStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

/**
 * Create a new async workload
 */
export const createWorkload = async (
  workload: Omit<AsyncWorkload, 'id' | 'created_at' | 'updated_at' | 'status' | 'progress' | 'current_step'>
): Promise<AsyncWorkload | null> => {
  try {
    const { data, error } = await supabase
      .from('async_workloads')
      .insert({
        ...workload,
        status: 'pending',
        progress: 0,
        current_step: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workload:', error);
      return null;
    }

    return data as AsyncWorkload;
  } catch (error) {
    console.error('Failed to create workload:', error);
    return null;
  }
};

/**
 * List workloads for a project
 */
export const listWorkloads = async (
  projectId: string,
  filters?: {
    status?: AsyncWorkload['status'];
    type?: AsyncWorkload['type'];
    limit?: number;
    offset?: number;
  }
): Promise<AsyncWorkload[]> => {
  try {
    let query = supabase
      .from('async_workloads')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing workloads:', error);
      return [];
    }

    return data as AsyncWorkload[];
  } catch (error) {
    console.error('Failed to list workloads:', error);
    return [];
  }
};

/**
 * Get a specific workload by ID
 */
export const getWorkloadStatus = async (workloadId: string): Promise<AsyncWorkload | null> => {
  try {
    const { data, error } = await supabase
      .from('async_workloads')
      .select('*')
      .eq('id', workloadId)
      .single();

    if (error) {
      console.error('Error getting workload status:', error);
      return null;
    }

    return data as AsyncWorkload;
  } catch (error) {
    console.error('Failed to get workload status:', error);
    return null;
  }
};

/**
 * Update workload progress
 */
export const updateWorkloadProgress = async (
  workloadId: string,
  update: {
    current_step?: number;
    progress?: number;
    step_description?: string;
    status?: AsyncWorkload['status'];
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('async_workloads')
      .update({
        ...update,
        updated_at: new Date().toISOString()
      })
      .eq('id', workloadId);

    if (error) {
      console.error('Error updating workload progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update workload progress:', error);
    return false;
  }
};

/**
 * Cancel a workload
 */
export const cancelWorkload = async (workloadId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('async_workloads')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('id', workloadId);

    if (error) {
      console.error('Error cancelling workload:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to cancel workload:', error);
    return false;
  }
};

/**
 * Mark workload as completed
 */
export const completeWorkload = async (
  workloadId: string,
  result?: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('async_workloads')
      .update({
        status: 'completed',
        progress: 100,
        result,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', workloadId);

    if (error) {
      console.error('Error completing workload:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to complete workload:', error);
    return false;
  }
};

/**
 * Mark workload as failed
 */
export const failWorkload = async (
  workloadId: string,
  errorMessage: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('async_workloads')
      .update({
        status: 'failed',
        error: errorMessage,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', workloadId);

    if (error) {
      console.error('Error failing workload:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to fail workload:', error);
    return false;
  }
};

/**
 * Get workload statistics
 */
export const getWorkloadStats = async (projectId: string): Promise<WorkloadStats> => {
  try {
    const { data, error } = await supabase
      .from('async_workloads')
      .select('status')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error getting workload stats:', error);
      return {
        total: 0,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
      };
    }

    const stats: WorkloadStats = {
      total: data.length,
      pending: data.filter(w => w.status === 'pending').length,
      running: data.filter(w => w.status === 'running').length,
      completed: data.filter(w => w.status === 'completed').length,
      failed: data.filter(w => w.status === 'failed').length,
      cancelled: data.filter(w => w.status === 'cancelled').length
    };

    return stats;
  } catch (error) {
    console.error('Failed to get workload stats:', error);
    return {
      total: 0,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };
  }
};

/**
 * Delete a workload
 */
export const deleteWorkload = async (workloadId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('async_workloads')
      .delete()
      .eq('id', workloadId);

    if (error) {
      console.error('Error deleting workload:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete workload:', error);
    return false;
  }
};

/**
 * Retry a failed workload
 */
export const retryWorkload = async (workloadId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('async_workloads')
      .update({
        status: 'pending',
        progress: 0,
        current_step: 0,
        error: null,
        result: null,
        started_at: null,
        completed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', workloadId);

    if (error) {
      console.error('Error retrying workload:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to retry workload:', error);
    return false;
  }
};

/**
 * Subscribe to workload updates
 */
export const subscribeToWorkload = (
  workloadId: string,
  callback: (workload: AsyncWorkload) => void
) => {
  const subscription = supabase
    .channel(`workload:${workloadId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'async_workloads',
        filter: `id=eq.${workloadId}`
      },
      (payload) => {
        callback(payload.new as AsyncWorkload);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Get recent workloads
 */
export const getRecentWorkloads = async (
  projectId: string,
  limit: number = 10
): Promise<AsyncWorkload[]> => {
  return listWorkloads(projectId, { limit });
};

/**
 * Get active workloads
 */
export const getActiveWorkloads = async (projectId: string): Promise<AsyncWorkload[]> => {
  try {
    const { data, error } = await supabase
      .from('async_workloads')
      .select('*')
      .eq('project_id', projectId)
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting active workloads:', error);
      return [];
    }

    return data as AsyncWorkload[];
  } catch (error) {
    console.error('Failed to get active workloads:', error);
    return [];
  }
};

/**
 * Estimate completion time
 */
export const estimateCompletion = (workload: AsyncWorkload): string | null => {
  if (workload.status !== 'running' || !workload.started_at) {
    return null;
  }

  const startTime = new Date(workload.started_at).getTime();
  const now = Date.now();
  const elapsed = now - startTime;

  if (workload.progress === 0) {
    return null;
  }

  const totalEstimated = (elapsed / workload.progress) * 100;
  const remaining = totalEstimated - elapsed;
  const completionTime = new Date(now + remaining);

  return completionTime.toISOString();
};

/**
 * Format workload duration
 */
export const formatDuration = (workload: AsyncWorkload): string => {
  const start = workload.started_at ? new Date(workload.started_at).getTime() : null;
  const end = workload.completed_at ? new Date(workload.completed_at).getTime() : Date.now();

  if (!start) {
    return 'Not started';
  }

  const duration = end - start;
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};