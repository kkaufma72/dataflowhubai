// Experiment Tracking System (MLflow-style)
// Automatically logs all model training experiments for reproducibility

import { supabase } from './supabase';

export interface Experiment {
  id: string;
  model_id: string;
  model_name: string;
  dataset_id: string;
  user_id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  artifacts: {
    model_path?: string;
    logs?: string;
    visualizations?: string[];
  };
  tags: string[];
  notes?: string;
  parent_experiment_id?: string; // For tracking iterations
}

export class ExperimentTracker {
  private static instance: ExperimentTracker;

  static getInstance(): ExperimentTracker {
    if (!ExperimentTracker.instance) {
      ExperimentTracker.instance = new ExperimentTracker();
    }
    return ExperimentTracker.instance;
  }

  async startExperiment(params: {
    modelName: string;
    datasetId: string;
    userId: string;
    parameters: Record<string, any>;
    tags?: string[];
    parentExperimentId?: string;
  }): Promise<string> {
    const experiment: Partial<Experiment> = {
      id: crypto.randomUUID(),
      model_id: crypto.randomUUID(),
      model_name: params.modelName,
      dataset_id: params.datasetId,
      user_id: params.userId,
      started_at: new Date().toISOString(),
      status: 'running',
      parameters: params.parameters,
      metrics: {},
      artifacts: {},
      tags: params.tags || [],
      parent_experiment_id: params.parentExperimentId
    };

    // Save to Supabase
    const { error } = await supabase
      .from('ml_experiments')
      .insert(experiment);

    if (error) {
      console.error('Failed to start experiment:', error);
      // Store locally if Supabase fails
      localStorage.setItem(`experiment_${experiment.id}`, JSON.stringify(experiment));
    }

    return experiment.id!;
  }

  async logMetric(experimentId: string, metricName: string, value: number) {
    const { data: experiment } = await supabase
      .from('ml_experiments')
      .select('metrics')
      .eq('id', experimentId)
      .single();

    if (experiment) {
      const updatedMetrics = {
        ...experiment.metrics,
        [metricName]: value
      };

      await supabase
        .from('ml_experiments')
        .update({ metrics: updatedMetrics })
        .eq('id', experimentId);
    }
  }

  async logParameters(experimentId: string, parameters: Record<string, any>) {
    await supabase
      .from('ml_experiments')
      .update({ parameters })
      .eq('id', experimentId);
  }

  async completeExperiment(experimentId: string, finalMetrics: Record<string, number>) {
    await supabase
      .from('ml_experiments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metrics: finalMetrics
      })
      .eq('id', experimentId);
  }

  async failExperiment(experimentId: string, error: string) {
    await supabase
      .from('ml_experiments')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        notes: error
      })
      .eq('id', experimentId);
  }

  async getExperiments(userId: string, filters?: {
    datasetId?: string;
    modelName?: string;
    status?: string;
    tags?: string[];
  }): Promise<Experiment[]> {
    let query = supabase
      .from('ml_experiments')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (filters?.datasetId) {
      query = query.eq('dataset_id', filters.datasetId);
    }

    if (filters?.modelName) {
      query = query.ilike('model_name', `%${filters.modelName}%`);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch experiments:', error);
      return [];
    }

    return data || [];
  }

  async compareExperiments(experimentIds: string[]): Promise<{
    experiments: Experiment[];
    comparison: {
      bestAccuracy: Experiment;
      fastestTraining: Experiment;
      bestF1: Experiment;
      parameterDifferences: Record<string, any[]>;
    };
  }> {
    const { data: experiments } = await supabase
      .from('ml_experiments')
      .select('*')
      .in('id', experimentIds);

    if (!experiments || experiments.length === 0) {
      throw new Error('No experiments found');
    }

    // Find best performers
    const bestAccuracy = experiments.reduce((best, exp) =>
      (exp.metrics.accuracy || 0) > (best.metrics.accuracy || 0) ? exp : best
    );

    const fastestTraining = experiments.reduce((fastest, exp) => {
      const duration = new Date(exp.completed_at!).getTime() - new Date(exp.started_at).getTime();
      const fastestDuration = new Date(fastest.completed_at!).getTime() - new Date(fastest.started_at).getTime();
      return duration < fastestDuration ? exp : fastest;
    });

    const bestF1 = experiments.reduce((best, exp) =>
      (exp.metrics.f1_score || 0) > (best.metrics.f1_score || 0) ? exp : best
    );

    // Analyze parameter differences
    const allParams = new Set(experiments.flatMap(e => Object.keys(e.parameters)));
    const parameterDifferences: Record<string, any[]> = {};

    allParams.forEach(param => {
      parameterDifferences[param] = experiments.map(e => e.parameters[param]);
    });

    return {
      experiments,
      comparison: {
        bestAccuracy,
        fastestTraining,
        bestF1,
        parameterDifferences
      }
    };
  }

  async addTags(experimentId: string, tags: string[]) {
    const { data: experiment } = await supabase
      .from('ml_experiments')
      .select('tags')
      .eq('id', experimentId)
      .single();

    if (experiment) {
      const updatedTags = [...new Set([...experiment.tags, ...tags])];
      await supabase
        .from('ml_experiments')
        .update({ tags: updatedTags })
        .eq('id', experimentId);
    }
  }

  async addNotes(experimentId: string, notes: string) {
    await supabase
      .from('ml_experiments')
      .update({ notes })
      .eq('id', experimentId);
  }

  async reproduceExperiment(experimentId: string): Promise<any> {
    const { data: experiment } = await supabase
      .from('ml_experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Create new experiment with same parameters
    return {
      datasetId: experiment.dataset_id,
      parameters: experiment.parameters,
      parentExperimentId: experimentId
    };
  }
}

// Export singleton
export const experimentTracker = ExperimentTracker.getInstance();
