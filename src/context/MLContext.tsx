import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, initializeSupabase, checkSupabaseHealth, handleSupabaseError } from '../lib/supabase';
import { Dataset, MLModel, Project } from '../types';
import { storage } from '../lib/storage';
import { generateSampleDatasets } from '../lib/sampleData';

interface MLContextType {
  currentProject: Project | null;
  datasets: Dataset[];
  models: MLModel[];
  isLoading: boolean;
  error: string | null;
  setCurrentProject: (project: Project) => void;
  addDataset: (dataset: Dataset) => Promise<Dataset>;
  addModel: (model: MLModel) => void;
  updateModelStatus: (id: string, status: string, metrics?: Record<string, number>) => void;
}

const MLContext = createContext<MLContextType | undefined>(undefined);

export const useMLContext = () => {
  const context = useContext(MLContext);
  if (context === undefined) {
    throw new Error('useMLContext must be used within a MLProvider');
  }
  return context;
};

interface MLProviderProps {
  children: ReactNode;
}

export const MLProvider = ({ children }: MLProviderProps) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<MLModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  const createDefaultProject = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Authentication required');
      }

      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert([{
          name: 'Default Project',
          description: 'Default project created automatically',
          user_id: session.user.id
        }])
        .select()
        .single();

      if (createError) throw createError;
      return newProject;
    } catch (err) {
      console.error('Error creating default project:', err);
      throw err;
    }
  };

  const initializeSampleData = async () => {
    try {
      // Get existing datasets from storage
      let localDatasets = await storage.getAllDatasets();
      
      // If no datasets exist, generate and save sample datasets
      if (localDatasets.length === 0) {
        console.log('Initializing sample datasets...');
        const sampleDatasets = generateSampleDatasets();
        
        // Save each dataset to IndexedDB
        await Promise.all(sampleDatasets.map(dataset => storage.saveDataset(dataset)));
        
        // Update local datasets
        localDatasets = sampleDatasets;
        console.log('Sample datasets initialized:', localDatasets.length);
      }

      return localDatasets;
    } catch (error) {
      console.error('Error initializing sample data:', error);
      throw error;
    }
  };

  const loadInitialData = async (retryAttempt = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error('No internet connection available');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      let isConnected;
      try {
        isConnected = await initializeSupabase();
      } catch (connError) {
        throw new Error(`Database connection error: ${handleSupabaseError(connError)}`);
      }

      if (!isConnected) {
        throw new Error('Failed to connect to database');
      }

      let { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!project && !projectError) {
        try {
          project = await createDefaultProject();
        } catch (createError) {
          throw new Error(`Failed to create default project: ${handleSupabaseError(createError)}`);
        }
      } else if (projectError) {
        throw projectError;
      }

      if (project) {
        setCurrentProject({
          id: project.id,
          name: project.name,
          description: project.description || '',
          createdAt: project.created_at
        });

        const [datasetsResponse, modelsResponse] = await Promise.all([
          supabase
            .from('datasets')
            .select('*')
            .eq('project_id', project.id)
            .eq('user_id', session.user.id),
          supabase
            .from('models')
            .select('*')
            .eq('project_id', project.id)
            .eq('user_id', session.user.id)
        ]);

        if (datasetsResponse.error) throw datasetsResponse.error;
        if (modelsResponse.error) throw modelsResponse.error;

        // Initialize sample data and merge with remote data
        const localDatasets = await initializeSampleData();
        const remoteDatasets = datasetsResponse.data || [];
        const mergedDatasets = [...localDatasets];
        
        for (const remoteDataset of remoteDatasets) {
          const localIndex = mergedDatasets.findIndex(d => d.id === remoteDataset.id);
          if (localIndex === -1) {
            mergedDatasets.push(remoteDataset);
          }
        }

        setDatasets(mergedDatasets);
        setModels(modelsResponse.data || []);
      } else {
        throw new Error('Failed to load or create project');
      }

      setIsLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error loading initial data:', err);
      const errorMessage = handleSupabaseError(err);
      
      if (retryAttempt < maxRetries) {
        console.log(`Retrying in ${retryDelay/1000} seconds... (Attempt ${retryAttempt + 1}/${maxRetries})`);
        setTimeout(() => {
          loadInitialData(retryAttempt + 1);
        }, retryDelay);
      } else {
        setError(errorMessage);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadInitialData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        loadInitialData();
      } else if (event === 'SIGNED_OUT') {
        setDatasets([]);
        setModels([]);
        setCurrentProject(null);
      }
    });

    // Listen for online/offline events
    const handleOnline = () => {
      setError(null);
      loadInitialData();
    };

    const handleOffline = () => {
      setError('No internet connection available');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const healthCheckInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setDatasets([]);
        setModels([]);
        setCurrentProject(null);
        return;
      }

      const isHealthy = await checkSupabaseHealth();
      if (!isHealthy && !error) {
        setError('Database connection lost');
      } else if (isHealthy && error) {
        setError(null);
      }
    }, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(healthCheckInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addDataset = async (dataset: Dataset) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Authentication required');
    }

    if (!currentProject?.id) {
      setError('No active project found');
      throw new Error('No active project found');
    }

    try {
      // Save to IndexedDB first
      await storage.saveDataset(dataset);
      
      // Update local state
      setDatasets(prevDatasets => [...prevDatasets, dataset]);

      // Try to save to Supabase
      const { data, error } = await supabase
        .from('datasets')
        .insert([{
          name: dataset.name,
          description: dataset.description,
          file_type: dataset.fileType,
          file_size: dataset.fileSize,
          row_count: dataset.rows,
          column_count: dataset.columns,
          preview_data: dataset.previewData,
          project_id: currentProject.id,
          user_id: session.user.id // Add user_id from session
        }])
        .select()
        .single();

      if (error) {
        console.warn('Failed to save dataset to remote database:', error);
        // Continue with local data only
      }

      return dataset;
    } catch (err) {
      console.error('Error adding dataset:', err);
      setError('Failed to add dataset');
      throw err;
    }
  };

  const addModel = async (model: MLModel) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Authentication required');
    }

    if (!currentProject?.id) {
      setError('No active project found');
      return;
    }

    try {
      // For non-UUID dataset IDs, set dataset_id to null in the database
      // but keep the reference in the local model object
      const localDatasetId = model.datasetId;
      
      const { data, error } = await supabase
        .from('models')
        .insert([{
          name: model.name,
          description: model.description,
          model_type: model.modelType || 'classification',
          status: model.status,
          dataset_id: null, // Set to null since we're using local dataset references
          project_id: currentProject.id,
          user_id: session.user.id, // Add user_id from session
          hyperparameters: model.hyperparameters || {},
          training_config: {},
          metadata: {
            local_dataset_id: localDatasetId // Store the local dataset ID in metadata
          }
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to create model in database');
      }

      if (!data) {
        throw new Error('No data returned from database');
      }

      const newModel: MLModel = {
        ...model,
        id: data.id,
        projectId: currentProject.id,
        createdAt: data.created_at,
        modelType: data.model_type,
        datasetId: localDatasetId // Keep the local dataset ID in the frontend model
      };

      setModels(prevModels => [...prevModels, newModel]);
      return newModel;
    } catch (err) {
      console.error('Error adding model:', err);
      setError(err instanceof Error ? err.message : 'Failed to add model');
      throw err;
    }
  };

  const updateModelStatus = async (
    id: string,
    status: string,
    metrics?: Record<string, number>
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Authentication required');
    }

    try {
      const { error } = await supabase
        .from('models')
        .update({ 
          status,
          metadata: { metrics },
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      setModels(prevModels =>
        prevModels.map(model =>
          model.id === id
            ? {
                ...model,
                status,
                ...(metrics ? { metrics } : {}),
              }
            : model
        )
      );
    } catch (err) {
      console.error('Error updating model status:', err);
      setError('Failed to update model status');
      throw err;
    }
  };

  return (
    <MLContext.Provider
      value={{
        currentProject,
        datasets,
        models,
        isLoading,
        error,
        setCurrentProject,
        addDataset,
        addModel,
        updateModelStatus,
      }}
    >
      {children}
    </MLContext.Provider>
  );
};