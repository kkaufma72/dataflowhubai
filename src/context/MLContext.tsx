import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, initializeSupabase, handleSupabaseError } from '../lib/supabase';
import { Dataset, MLModel, Project } from '../types';
import { storage } from '../lib/storage';
import { useAuth } from '../components/auth/AuthProvider';

interface MLContextType {
  datasets: Dataset[];
  models: MLModel[];
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  addDataset: (dataset: Dataset) => Promise<Dataset>;
  updateDataset: (id: string, updates: Partial<Dataset>) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  addModel: (model: MLModel) => Promise<void>;
  updateModelStatus: (id: string, status: string, metrics?: Record<string, number>) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  refreshProjects: () => Promise<void>;
}

const MLContext = createContext<MLContextType | undefined>(undefined);

const DEMO_PROJECT: Project = {
  id: 'demo-project',
  name: 'Sample Workspace',
  description: 'Sample datasets and models',
  createdAt: new Date().toISOString()
};

const LAST_PROJECT_KEY = 'dfh-last-project-id';

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
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<MLModel[]>([]);
  const [projects, setProjects] = useState<Project[]>([DEMO_PROJECT]);
  const [currentProject, setCurrentProject] = useState<Project | null>(DEMO_PROJECT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const loadProjects = useCallback(async () => {
    if (!user?.id) {
      setProjects([DEMO_PROJECT]);
      setCurrentProject(DEMO_PROJECT);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id,name,description,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        createdAt: project.created_at
      }));

      setProjects(mapped);

      const savedProjectId = localStorage.getItem(LAST_PROJECT_KEY);
      const savedProject = mapped.find((project) => project.id === savedProjectId);

      if (savedProject) {
        setCurrentProject(savedProject);
      } else if (mapped.length > 0) {
        setCurrentProject(mapped[0]);
      } else {
        setCurrentProject(null);
      }
    } catch (projectError) {
      console.error('Error loading projects:', projectError);
      setProjects([DEMO_PROJECT]);
      setCurrentProject(DEMO_PROJECT);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (currentProject) {
      localStorage.setItem(LAST_PROJECT_KEY, currentProject.id);
    }
  }, [currentProject]);

  const loadInitialData = useCallback(async () => {
    // Prevent multiple calls
    if (hasFetched) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated from AuthProvider context (don't call supabase.auth.getSession() as it hangs)
      const isAuthenticated = !!user;
      
      if (!isAuthenticated) {
        // Not logged in - just load sample data
        const localDatasets = await initializeSampleData();
        setDatasets(localDatasets);
        setIsLoading(false);
        setHasFetched(true);
        return;
      }

      // Initialize Supabase connection
      const isConnected = await initializeSupabase();
      if (!isConnected) {
        throw new Error('Failed to connect to database');
      }

      if (!user?.id) {
        throw new Error('User ID not available');
      }

      // OPTIMIZATION: Fetch datasets and models using direct fetch (no project filtering)
      const { supabaseFetch } = await import('../lib/supabaseHelpers');
      
      // OPTIMIZATION: Parallel fetch of datasets and models using direct fetch
      const [datasetsResponse, modelsResponse] = await Promise.all([
        supabaseFetch(
          `/rest/v1/datasets?user_id=eq.${user.id}&select=id,name,description,row_count,column_count,file_type,file_size,created_at,user_id,preview_data&order=created_at.desc`,
          { method: 'GET' }
        ),
        supabaseFetch(
          `/rest/v1/models?user_id=eq.${user.id}&select=*&order=created_at.desc`,
          { method: 'GET' }
        )
      ]);

      // Parse fetch responses and transform snake_case to camelCase
      const remoteDatasets = (datasetsResponse.ok ? await datasetsResponse.json() : []).map((ds: any) => ({
        id: ds.id,
        name: ds.name,
        description: ds.description,
        rows: ds.row_count,
        columns: ds.column_count,
        dateUploaded: ds.created_at,
        fileType: ds.file_type,
        fileSize: ds.file_size,
        projectId: ds.project_id,
        preview_data: ds.preview_data,
      })) as Dataset[];
      const remoteModels = (modelsResponse.ok ? await modelsResponse.json() : []) as MLModel[];

      // Auto-load sample data for new users with no datasets
      // Check flag BEFORE loading to prevent duplicate seeding
      const hasSeededKey = `hasSeededDatasets_${user.id}`;
      const hasSeeded = localStorage.getItem(hasSeededKey);
      
      // ONLY seed if: no remote datasets AND flag not set
      if (remoteDatasets.length === 0 && user?.id && !hasSeeded) {
        console.log('🎯 New user detected - auto-loading sample data...');
        try {
          // Set flag BEFORE seeding to prevent concurrent runs
          localStorage.setItem(hasSeededKey, 'true');
          const { seedEnhancedDatasets } = await import('../utils/seedDatasets');
          await seedEnhancedDatasets(user.id, null);
          
          // Refresh datasets after seeding
          const refreshResponse = await supabaseFetch(
            `/rest/v1/datasets?user_id=eq.${user.id}&select=id,name,description,row_count,column_count,file_type,file_size,created_at,user_id,preview_data&order=created_at.desc`,
            { method: 'GET' }
          );
          
          if (refreshResponse.ok) {
            const refreshedDatasets = (await refreshResponse.json()).map((ds: any) => ({
              id: ds.id,
              name: ds.name,
              description: ds.description,
              rows: ds.row_count,
              columns: ds.column_count,
              dateUploaded: ds.created_at,
              fileType: ds.file_type,
              fileSize: ds.file_size,
              projectId: ds.project_id,
              preview_data: ds.preview_data,
            }));
            setDatasets(refreshedDatasets);
            console.log('✅ Sample data loaded for new user');
          } else {
            // If refresh failed, just use remote datasets
            setDatasets(remoteDatasets);
          }
        } catch (seedError) {
          console.warn('Could not auto-load sample data:', seedError);
          // Remove flag on failure so it can retry next time
          localStorage.removeItem(hasSeededKey);
          setDatasets(remoteDatasets);
        }
      } else {
        // User has data or already seeded - just use remote datasets
        setDatasets(remoteDatasets);
      }
      
      setModels(remoteModels);
      setIsLoading(false);
      setHasFetched(true);

    } catch (err) {
      console.error('Error loading initial data:', err);
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [hasFetched, user]);

  // Only load data once on mount
  useEffect(() => {
    if (!hasFetched) {
      loadInitialData();
    }
  }, [hasFetched, loadInitialData]);

    // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (session) {
          setHasFetched(false);
          loadProjects();
        } else {
          setDatasets([]);
          setModels([]);
          setProjects([DEMO_PROJECT]);
          setCurrentProject(DEMO_PROJECT);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProjects]);

  const addDataset = useCallback(async (dataset: Dataset): Promise<Dataset> => {
    try {
      // Save to Supabase first if user is authenticated
      if (user) {
        const datasetData = {
          id: dataset.id,
          name: dataset.name,
          description: dataset.description,
          file_type: dataset.fileType,
          file_size: dataset.fileSize,
          row_count: dataset.rows,
          column_count: dataset.columns,
          preview_data: dataset.preview_data,
          user_id: user.id,
          project_id: currentProject?.id || null,
          created_at: dataset.dateUploaded || new Date().toISOString(),
        };

        const { error } = await supabase
          .from('datasets')
          .insert(datasetData);

        if (error) {
          console.error('❌ Error saving dataset to Supabase:', error);
          throw error;
        }

        console.log('✅ Dataset saved to Supabase');
      }

      // Try to save to IndexedDB but don't fail if it hangs
      try {
        await storage.saveDataset(dataset);
      } catch (error) {
        console.warn('⚠️ IndexedDB save failed, continuing anyway:', error);
      }
      
      // Always update state
      setDatasets(prev => [dataset, ...prev]);
      return dataset;
    } catch (error) {
      console.error('Error adding dataset:', error);
      throw error;
    }
  }, [user, currentProject?.id]);

  const updateDataset = useCallback(async (id: string, updates: Partial<Dataset>): Promise<void> => {
    try {
      // Find the dataset to update
      const datasetToUpdate = datasets.find(d => d.id === id);
      if (!datasetToUpdate) {
        throw new Error('Dataset not found');
      }

      const updatedDataset = { ...datasetToUpdate, ...updates };

      // Update in Supabase if user is authenticated
      if (user) {
        const { error } = await supabase
          .from('datasets')
          .update({
            preview_data: updatedDataset.preview_data,
            row_count: updatedDataset.rows,
            column_count: updatedDataset.columns,
          })
          .eq('id', id);

        if (error) {
          console.error('Error updating dataset in Supabase:', error);
          throw error;
        }
      }

      // Update in IndexedDB
      try {
        await storage.saveDataset(updatedDataset);
      } catch (error) {
        console.warn('⚠️ IndexedDB update failed, continuing anyway:', error);
      }

      // Update state
      setDatasets(prev => prev.map(d => d.id === id ? updatedDataset : d));
    } catch (error) {
      console.error('Error updating dataset:', error);
      throw error;
    }
  }, [datasets, user]);

  const deleteDataset = useCallback(async (id: string): Promise<void> => {
    try {
      // Delete from Supabase if user is authenticated
      if (user) {
        const { error } = await supabase
          .from('datasets')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting dataset from Supabase:', error);
          throw error;
        }
      }

      // Delete from IndexedDB
      try {
        await storage.deleteDataset(id);
      } catch (error) {
        console.warn('⚠️ IndexedDB delete failed, continuing anyway:', error);
      }

      // Update state
      setDatasets(prev => prev.filter(d => d.id !== id));
      console.log(`✅ Dataset ${id} deleted successfully`);
    } catch (error) {
      console.error('Error deleting dataset:', error);
      throw error;
    }
  }, [user]);

  const addModel = useCallback(async (model: MLModel) => {
    try {
      // Save to Supabase if user is authenticated
      if (user) {
        const projectId = model.projectId ?? currentProject?.id ?? null;

        // Verify dataset exists in Supabase before creating model
        if (model.datasetId) {
          const { data: datasetCheck, error: checkError } = await supabase
            .from('datasets')
            .select('id')
            .eq('id', model.datasetId)
            .single();

          if (checkError || !datasetCheck) {
            console.error('❌ Dataset not found in Supabase:', model.datasetId);
            
            // Try to find the dataset in local state and save it
            const localDataset = datasets.find(d => d.id === model.datasetId);
            if (localDataset) {
              console.log('📤 Found dataset in local state, saving to Supabase...');
              
              const datasetData = {
                id: localDataset.id,
                name: localDataset.name,
                description: localDataset.description,
                file_type: localDataset.fileType,
                file_size: localDataset.fileSize,
                row_count: localDataset.rows,
                column_count: localDataset.columns,
                preview_data: localDataset.preview_data,
                user_id: user.id,
                project_id: localDataset.projectId || currentProject?.id || null,
                created_at: localDataset.dateUploaded || new Date().toISOString(),
              };

              const { error: insertError } = await supabase
                .from('datasets')
                .insert(datasetData);

              if (insertError) {
                console.error('❌ Failed to save dataset to Supabase:', {
                  code: insertError.code,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint,
                  datasetData
                });
                throw new Error(`Failed to save dataset: ${insertError.message}. ${insertError.details || ''}`);
              }
              
              console.log('✅ Dataset saved to Supabase successfully');
            } else {
              throw new Error(`Dataset ${model.datasetId} not found. Please select a valid dataset.`);
            }
          }
        }

        const modelData = {
          id: model.id,
          name: model.name,
          description: model.description || '',
          model_type: model.modelType || 'classification',
          status: model.status,
          dataset_id: model.datasetId || null,
          project_id: projectId,
          hyperparameters: model.hyperparameters || {},
          training_config: model.config || {},
          metadata: model.metrics ? { metrics: model.metrics } : {},
          user_id: user.id,
        };
        
        console.log('💾 Attempting to save model to Supabase:', modelData);
        
        const { error } = await supabase
          .from('models')
          .insert(modelData);

        if (error) {
          // If duplicate key, model already exists - just skip insert
          if (error.code === '23505') {
            console.warn('⚠️ Model already exists in database, skipping insert');
            // Don't throw, just continue to add to state
          } else {
            console.error('❌ Error saving model to Supabase:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
            throw error;
          }
        } else {
          console.log('✅ Model saved successfully');
        }
      }

      // Update state - check if model already exists
      setModels(prev => {
        const exists = prev.some(m => m.id === model.id);
        if (exists) {
          console.warn('⚠️ Model already in state, skipping duplicate');
          return prev;
        }
        return [model, ...prev];
      });
    } catch (error) {
      console.error('Error adding model:', error);
      throw error;
    }
  }, [user, currentProject?.id, datasets]);

  const updateModelStatus = useCallback(async (id: string, status: string, metrics?: Record<string, number>) => {
    try {
      // Update in Supabase if user is authenticated
      if (user) {
        const updateData: Record<string, unknown> = { status };
        
        // If metrics provided, merge with existing metadata
        if (metrics) {
          updateData.metadata = { metrics };
        }

        const { error } = await supabase
          .from('models')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('Error updating model status in Supabase:', error);
          throw error;
        }
      }

      // Update state
      setModels(prev =>
        prev.map(model =>
          model.id === id
            ? { ...model, status: status as MLModel['status'], ...(metrics && { metrics }) }
            : model
        )
      );
    } catch (error) {
      console.error('Error updating model status:', error);
      throw error;
    }
  }, [user]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    datasets,
    models,
    projects,
    currentProject,
    isLoading,
    error,
    addDataset,
    updateDataset,
    deleteDataset,
    addModel,
    updateModelStatus,
    setCurrentProject,
    refreshProjects: loadProjects,
  }), [
    datasets,
    models,
    projects,
    currentProject,
    isLoading,
    error,
    addDataset,
    updateDataset,
    deleteDataset,
    addModel,
    updateModelStatus,
    loadProjects,
  ]);

  return <MLContext.Provider value={value}>{children}</MLContext.Provider>;
};

export default MLProvider;
