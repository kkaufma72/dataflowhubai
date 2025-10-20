// src/lib/deploymentService.ts

import { supabase } from './supabase';

export interface DeploymentStatus {
  id: string;
  model_id: string;
  status: 'deploying' | 'active' | 'failed' | 'stopped';
  endpoint_url?: string;
  health_status: 'healthy' | 'degraded' | 'unhealthy';
  uptime_percentage: number;
  total_requests: number;
  error_rate: number;
  avg_response_time: number;
  last_health_check: string;
  created_at: string;
  updated_at: string;
}

export interface DeploymentMetrics {
  timestamp: string;
  requests: number;
  errors: number;
  response_time: number;
  cpu_usage: number;
  memory_usage: number;
}

/**
 * Get deployment status for a model
 */
export const getDeploymentStatus = async (modelId: string): Promise<DeploymentStatus | null> => {
  try {
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('model_id', modelId)
      .single();

    if (error) {
      console.error('Error fetching deployment status:', error);
      return null;
    }

    return data as DeploymentStatus;
  } catch (error) {
    console.error('Failed to get deployment status:', error);
    return null;
  }
};

/**
 * Get deployment metrics for a time range
 */
export const getDeploymentMetrics = async (
  deploymentId: string,
  timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<DeploymentMetrics[]> => {
  try {
    const now = new Date();
    const startTime = new Date(now);

    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setHours(now.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
    }

    const { data, error } = await supabase
      .from('deployment_metrics')
      .select('*')
      .eq('deployment_id', deploymentId)
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching deployment metrics:', error);
      return [];
    }

    return data as DeploymentMetrics[];
  } catch (error) {
    console.error('Failed to get deployment metrics:', error);
    return [];
  }
};

/**
 * Deploy a model
 */
export const deployModel = async (modelId: string, config?: any): Promise<DeploymentStatus | null> => {
  try {
    const { data, error } = await supabase
      .from('deployments')
      .insert({
        model_id: modelId,
        status: 'deploying',
        health_status: 'healthy',
        uptime_percentage: 100,
        total_requests: 0,
        error_rate: 0,
        avg_response_time: 0,
        last_health_check: new Date().toISOString(),
        config: config || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error deploying model:', error);
      return null;
    }

    // Simulate deployment process
    setTimeout(async () => {
      await supabase
        .from('deployments')
        .update({
          status: 'active',
          endpoint_url: `https://api.dataflowhub.ai/models/${modelId}/predict`
        })
        .eq('id', data.id);
    }, 3000);

    return data as DeploymentStatus;
  } catch (error) {
    console.error('Failed to deploy model:', error);
    return null;
  }
};

/**
 * Stop a deployment
 */
export const stopDeployment = async (deploymentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('deployments')
      .update({
        status: 'stopped',
        health_status: 'unhealthy'
      })
      .eq('id', deploymentId);

    if (error) {
      console.error('Error stopping deployment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to stop deployment:', error);
    return false;
  }
};

/**
 * Restart a deployment
 */
export const restartDeployment = async (deploymentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('deployments')
      .update({
        status: 'deploying',
        health_status: 'healthy'
      })
      .eq('id', deploymentId);

    if (error) {
      console.error('Error restarting deployment:', error);
      return false;
    }

    // Simulate restart
    setTimeout(async () => {
      await supabase
        .from('deployments')
        .update({ status: 'active' })
        .eq('id', deploymentId);
    }, 2000);

    return true;
  } catch (error) {
    console.error('Failed to restart deployment:', error);
    return false;
  }
};

/**
 * Update deployment configuration
 */
export const updateDeploymentConfig = async (
  deploymentId: string,
  config: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('deployments')
      .update({ config })
      .eq('id', deploymentId);

    if (error) {
      console.error('Error updating deployment config:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update deployment config:', error);
    return false;
  }
};

/**
 * Get all deployments for a project
 */
export const getProjectDeployments = async (projectId: string): Promise<DeploymentStatus[]> => {
  try {
    const { data, error } = await supabase
      .from('deployments')
      .select(`
        *,
        models (
          name,
          algorithm,
          project_id
        )
      `)
      .eq('models.project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project deployments:', error);
      return [];
    }

    return data as DeploymentStatus[];
  } catch (error) {
    console.error('Failed to get project deployments:', error);
    return [];
  }
};

/**
 * Check deployment health
 */
export const checkDeploymentHealth = async (deploymentId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('deployments')
      .select('endpoint_url')
      .eq('id', deploymentId)
      .single();

    if (error || !data?.endpoint_url) {
      return false;
    }

    // In a real implementation, this would ping the actual endpoint
    // For now, we'll simulate a health check
    const isHealthy = Math.random() > 0.1; // 90% success rate

    await supabase
      .from('deployments')
      .update({
        health_status: isHealthy ? 'healthy' : 'degraded',
        last_health_check: new Date().toISOString()
      })
      .eq('id', deploymentId);

    return isHealthy;
  } catch (error) {
    console.error('Failed to check deployment health:', error);
    return false;
  }
};