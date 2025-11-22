import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, initializeSupabase, handleSupabaseError } from '../lib/supabase';
import { Dataset, MLModel, Project } from '../types';
import { storage } from '../lib/storage';
import { useAuth } from '../components/auth/AuthProvider';
import toast from 'react-hot-toast';

interface MLContextType {
  datasets: Dataset[];
  models: MLModel[];
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  addDataset: (dataset: Dataset, options?: { persist?: boolean }) => Promise<Dataset>;
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUUID = (value?: string | null): boolean => {
  if (!value) return false;
  return UUID_REGEX.test(value);
};

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = 8000): Promise<T> => {
  let timeoutHandle: number;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = window.setTimeout(() => {
      reject(new Error('Request timed out'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    window.clearTimeout(timeoutHandle);
  }
};

type SampleDatasetRecord = {
  id: string;
  name: string;
  description: string;
  row_count: number;
  column_count: number;
  file_type: string;
  file_size: string;
  preview_data?: Dataset['preview_data'];
};

type SupabaseDatasetRow = {
  id: string;
  name: string;
  description: string;
  row_count: number;
  column_count: number;
  file_type: string;
  file_size: string;
  created_at: string;
  project_id: string | null;
  preview_data?: Dataset['preview_data'];
};

const buildLocalSampleDatasets = async (): Promise<Dataset[]> => {
  const { generateEnhancedSampleDatasets } = await import('../lib/enhancedSampleData');
  const samples = generateEnhancedSampleDatasets() as SampleDatasetRecord[];
  return samples.map((sample) => ({
    id: sample.id,
    name: sample.name,
    description: sample.description,
    rows: sample.row_count,
    columns: sample.column_count,
    dateUploaded: new Date().toISOString(),
    fileType: sample.file_type,
    fileSize: sample.file_size,
    projectId: null,
    preview_data: sample.preview_data,
  }));
};

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

    let fallbackTimer: number | undefined;
    const clearFallbackTimer = () => {
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = undefined;
      }
    };
    
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated from AuthProvider context (don't call supabase.auth.getSession() as it hangs)
      const isAuthenticated = !!user;
      
      if (!isAuthenticated) {
        // Not logged in - no data to load
        setDatasets([]);
        setModels([]);
        setIsLoading(false);
        setHasFetched(true);
        return;
      }

      if (!user?.id) {
        throw new Error('User ID not available');
      }

      const localSamplesPromise = buildLocalSampleDatasets();
      let initialDataApplied = false;

      const applyInitialState = (appliedDatasets: Dataset[], modelsToApply: MLModel[]) => {
        setDatasets(appliedDatasets);
        setModels(modelsToApply);
        setIsLoading(false);
        setHasFetched(true);
        initialDataApplied = true;
      };

      const scheduleLocalFallback = () => {
        fallbackTimer = window.setTimeout(() => {
          void (async () => {
            if (initialDataApplied) return;
            try {
              const fallbackSamples = await localSamplesPromise;
              if (!initialDataApplied) {
                applyInitialState(fallbackSamples, []);
              }
            } catch (fallbackError) {
              console.warn('Failed to prepare fallback sample datasets:', fallbackError);
            }
          })();
        }, 1200);
      };

      // Initialize Supabase connection
      const isConnected = await initializeSupabase();
      if (!isConnected) {
        throw new Error('Failed to connect to database');
      }

      scheduleLocalFallback();

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

      clearFallbackTimer();

      // Parse fetch responses and transform snake_case to camelCase
      const mapSupabaseDatasetRow = (ds: SupabaseDatasetRow): Dataset => ({
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
      });

      const remoteDatasets = (datasetsResponse.ok ? await datasetsResponse.json() : []).map(
        (ds: SupabaseDatasetRow) => mapSupabaseDatasetRow(ds)
      );
      const remoteModels = (modelsResponse.ok ? await modelsResponse.json() : []) as MLModel[];

      // Auto-load sample data behavior
      const hasSeededKey = user?.id ? `hasSeededDatasets_${user.id}` : null;
      const hasSeeded = hasSeededKey ? localStorage.getItem(hasSeededKey) : null;

      if (remoteDatasets.length > 0) {
        if (initialDataApplied) {
          setDatasets(remoteDatasets);
          setModels(remoteModels);
        } else {
          applyInitialState(remoteDatasets, remoteModels);
        }
      } else {
        const localSamples = await localSamplesPromise;
        if (initialDataApplied) {
          setDatasets(localSamples);
          setModels(remoteModels);
        } else {
          applyInitialState(localSamples, remoteModels);
        }

        if (user?.id && !hasSeeded) {
          void (async () => {
            console.log('🎯 Seeding Supabase sample datasets in background...');
            try {
              if (hasSeededKey) {
                localStorage.setItem(hasSeededKey, 'true');
              }
              const { seedEnhancedDatasets } = await import('../utils/seedDatasets');
              const toastId = 'sample-seed-status';
              toast.loading('Saving sample datasets to your workspace…', { id: toastId });
              await seedEnhancedDatasets(user.id, null);

              const refreshResponse = await withTimeout(
                supabaseFetch(
                  `/rest/v1/datasets?user_id=eq.${user.id}&select=id,name,description,row_count,column_count,file_type,file_size,created_at,user_id,preview_data&order=created_at.desc`,
                  { method: 'GET' }
                ),
                8000
              );

              if (refreshResponse.ok) {
                const seededDatasets = (await refreshResponse.json()).map(mapSupabaseDatasetRow);
                if (seededDatasets.length > 0) {
                  setDatasets(seededDatasets);
                  console.log('✅ Supabase samples synced');
                  toast.success('Sample datasets saved to your workspace.', { id: toastId, duration: 4000 });
                } else {
                  toast('Samples saved locally—refresh to retry sync.', { id: toastId });
                }
              } else {
                console.warn('Sample refresh failed after seeding:', refreshResponse.status);
                if (hasSeededKey) {
                  localStorage.removeItem(hasSeededKey);
                }
                toast.error('Could not refresh saved samples. You can keep exploring locally.', { id: toastId });
              }
            } catch (error) {
              console.warn('Background seeding failed:', error);
              if (hasSeededKey) {
                localStorage.removeItem(hasSeededKey);
              }
              toast.error('Saving sample datasets failed. Try again later.', { id: toastId });
            }
          })();
        }
      }

    } catch (err) {
      clearFallbackTimer();
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

  const addDataset = useCallback(async (dataset: Dataset, options?: { persist?: boolean }): Promise<Dataset> => {
    const shouldPersist = options?.persist !== false;
    const datasetWithValidId = isValidUUID(dataset.id)
      ? dataset
      : { ...dataset, id: generateUUID() };

    const initialProjectId = isValidUUID(datasetWithValidId.projectId || undefined)
      ? datasetWithValidId.projectId!
      : null;
    let resolvedProjectId = initialProjectId;

    try {
      // Save to Supabase first if user is authenticated
      if (user && shouldPersist) {
        // Ensure we have a valid project_id
        let validProjectId = resolvedProjectId || currentProject?.id;
        
        if (!validProjectId) {
          // Get or create default project
          const { data: existingProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
          
          if (existingProjects && existingProjects.length > 0) {
            validProjectId = existingProjects[0].id;
          } else {
            // Create default project
            const { data: newProject, error: projectError } = await supabase
              .from('projects')
              .insert({
                name: 'Default Workspace',
                description: 'Default workspace for datasets',
                user_id: user.id,
              })
              .select('id')
              .single();
            
            if (projectError) {
              console.error('Failed to create project:', projectError);
              throw new Error('Could not create default project');
            }
            
            validProjectId = newProject.id;
          }
        }
        resolvedProjectId = validProjectId;
        
        const datasetData = {
          id: datasetWithValidId.id,
          name: datasetWithValidId.name,
          description: datasetWithValidId.description,
          file_type: datasetWithValidId.fileType,
          file_size: datasetWithValidId.fileSize,
          row_count: datasetWithValidId.rows,
          column_count: datasetWithValidId.columns,
          preview_data: datasetWithValidId.preview_data,
          user_id: user.id,
          project_id: validProjectId, // Always set project_id
          created_at: datasetWithValidId.dateUploaded || new Date().toISOString(),
        };

        const { error } = await supabase
          .from('datasets')
          .insert(datasetData);

        if (error) {
          console.error('❌ Error saving dataset to Supabase:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          throw error;
        }

        console.log('✅ Dataset saved to Supabase with project_id:', validProjectId);
      }

      const datasetForState = resolvedProjectId
        ? { ...datasetWithValidId, projectId: resolvedProjectId }
        : datasetWithValidId;

      // Try to save to IndexedDB but don't fail if it hangs
      try {
        await storage.saveDataset(datasetForState);
      } catch (error) {
        console.warn('⚠️ IndexedDB save failed, continuing anyway:', error);
      }
      
      // Always update state
      setDatasets(prev => [datasetForState, ...prev]);
      return datasetForState;
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
