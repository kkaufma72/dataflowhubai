import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, initializeSupabase, checkSupabaseHealth, handleSupabaseError } from '../lib/supabase';
import { Dataset, MLModel, Project } from '../types';
import { StorageManager } from '../lib/storage';
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
  const [hasInitialized, setHasInitialized] = useState(false);

  const storage = StorageManager.getInstance();

  // Helper function to timeout promises
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      )
    ]);
  };

  const createDefaultProject = async (userId: string) => {
    try {
      console.log('Creating default project for user:', userId);

      const { data: newProject, error: createError } = await withTimeout(
        supabase
          .from('projects')
          .insert([{
            name: 'Default Project',
            description: 'Default project created automatically',
            user_id: userId
          }])
          .select()
          .single(),
        10000,
        'Project creation timeout'
      );

      if (createError) {
        console.error('Error creating project:', createError);
        throw createError;
      }
      
      console.log('✅ Created default project:', newProject);
      return newProject;
    } catch (err) {
      console.error('❌ Error creating default project:', err);
      throw err;
    }
  };

  const initializeSampleData = async () => {
    try {
      let localDatasets = await storage.getAllDatasets();
      
      if (localDatasets.length === 0) {
        console.log('📊 Initializing sample datasets...');
        const sampleDatasets = generateSampleDatasets();
        
        await Promise.all(sampleDatasets.map(dataset => storage.saveDataset(dataset)));
        localDatasets = sampleDatasets;
        console.log('✅ Sample datasets initialized:', localDatasets.length);
      } else {
        console.log('📊 Found existing local datasets:', localDatasets.length);
      }

      return localDatasets;
    } catch (error) {
      console.error('❌ Error initializing sample data:', error);
      return []; // Return empty array instead of throwing
    }
  };

  const loadInitialData = async () => {
    // Prevent multiple simultaneous initializations
    if (hasInitialized) {
      console.log('⏭️ Already initialized, skipping');
      return;
    }

    console.log('🔄 loadInitialData called');
    
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Load sample data first (always works)
      console.log('📊 Loading sample data...');
      const localDatasets = await initializeSampleData();
      setDatasets(localDatasets);
      console.log('✅ Sample data loaded:', localDatasets.length);

      // Step 2: Try to get session with timeout
      console.log('🔍 Checking for session (with 5s timeout)...');
      let session;
      try {
        const sessionResponse = await withTimeout(
          supabase.auth.getSession(),
          5000,
          'Session check timeout after 5s'
        );
        session = sessionResponse.data?.session;
        console.log('✅ Session check complete:', session ? `User: ${session.user.email}` : 'No session');
      } catch (timeoutError) {
        console.error('⏱️ Session check timed out:', timeoutError);
        // Continue without session
        session = null;
      }

      if (!session) {
        console.log('⚠️ No session - creating local project');
        
        // Create a temporary local project
        const tempProject = {
          id: 'temp-local-project',
          name: 'Local Project',
          description: 'Sign in to sync your data',
          createdAt: new Date().toISOString()
        };
        setCurrentProject(tempProject);
        console.log('✅ Set temporary local project');
        setIsLoading(false);
        setHasInitialized(true);
        return;
      }

      // Step 3: Initialize Supabase connection
      console.log('🔌 Initializing Supabase...');
      try {
        const isConnected = await withTimeout(
          initializeSupabase(),
          5000,
          'Supabase init timeout'
        );
        console.log('✅ Supabase connected:', isConnected);
      } catch (connError) {
        console.error('❌ Supabase connection failed:', connError);
        throw connError;
      }

      // Step 4: Load or create project
      console.log('🔍 Looking for user projects...');
      let project;
      try {
        const { data, error: projectError } = await withTimeout(
          supabase
            .from('projects')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle(),
          10000,
          'Project fetch timeout'
        );

        if (projectError) throw projectError;
        project = data;
      } catch (projectError) {
        console.error('❌ Error fetching project:', projectError);
        throw projectError;
      }

      if (!project) {
        console.log('⚠️ No project found, creating default...');
        project = await createDefaultProject(session.user.id);
      } else {
        console.log('✅ Found existing project:', project.name);
      }

      // Step 5: Set the project
      const projectObj = {
        id: project.id,
        name: project.name,
        description: project.description || '',
        createdAt: project.created_at
      };
      
      console.log('🎯 Setting current project:', projectObj.name);
      setCurrentProject(projectObj);

      // Step 6: Load datasets and models
      console.log('📦 Loading datasets and models from DB...');
      try {
        const [datasetsResponse, modelsResponse] = await withTimeout(
          Promise.all([
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
          ]),
          10000,
          'Data fetch timeout'
        );

        if (datasetsResponse.error) throw datasetsResponse.error;
        if (modelsResponse.error) throw modelsResponse.error;

        const fetchedDatasets = (datasetsResponse.data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          description: d.description || '',
          rows: d.row_count || 0,
          columns: d.column_count || 0,
          dateUploaded: d.created_at,
          fileType: d.file_type || '',
          fileSize: d.file_size || '',
          projectId: d.project_id,
          previewData: d.preview_data || { columns: [], rows: [] }
        }));

        console.log('📊 Fetched datasets from DB:', fetchedDatasets.length);

        // Merge with local datasets
        const allDatasets = [...fetchedDatasets, ...localDatasets];
        const uniqueDatasets = Array.from(
          new Map(allDatasets.map(d => [d.id, d])).values()
        );

        console.log('✅ Total unique datasets:', uniqueDatasets.length);
        setDatasets(uniqueDatasets);

        const fetchedModels = (modelsResponse.data || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          description: m.description || '',
          modelType: m.model_type || 'classification',
          datasetId: m.metadata?.local_dataset_id || m.dataset_id,
          status: m.status || 'idle',
          accuracy: m.metadata?.metrics?.accuracy,
          metrics: m.metadata?.metrics || {},
          createdAt: m.created_at,
          projectId: m.project_id,
          hyperparameters: m.hyperparameters || {}
        }));

        console.log('✅ Loaded models:', fetchedModels.length);
        setModels(fetchedModels);
      } catch (dataError) {
        console.error('❌ Error loading data:', dataError);
        // Continue with just local datasets
        console.log('ℹ️ Continuing with local datasets only');
      }

      console.log('✅ Loading complete!');
      setIsLoading(false);
      setHasInitialized(true);

    } catch (err) {
      console.error('❌ Error in loadInitialData:', err);
      
      // Fallback: Create local project
      console.log('🆘 Setting up fallback local project...');
      const localDatasets = await initializeSampleData();
      setDatasets(localDatasets);
      
      const tempProject = {
        id: 'temp-local-project',
        name: 'Local Project',
        description: 'Connection failed - data saved locally',
        createdAt: new Date().toISOString()
      };
      setCurrentProject(tempProject);
      
      setError('Could not connect to database. Using local storage.');
      setIsLoading(false);
      setHasInitialized(true);
    }
  };

  useEffect(() => {
    console.log('🚀 MLProvider mounted');
    loadInitialData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        if (event === 'SIGNED_IN' && session) {
          console.log('👤 User signed in, reloading...');
          setHasInitialized(false);
          await loadInitialData();
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setDatasets([]);
          setModels([]);
          setCurrentProject(null);
          setHasInitialized(false);
        }
      }
    );

    return () => {
      console.log('🧹 MLProvider unmounting');
      subscription.unsubscribe();
    };
  }, []);

  const addDataset = async (dataset: Dataset) => {
    console.log('➕ Adding dataset:', dataset.name);
    
    if (!currentProject?.id) {
      console.error('❌ No current project!', currentProject);
      throw new Error('No active project. Please wait for initialization to complete.');
    }

    console.log('📁 Current project:', currentProject.name, currentProject.id);

    try {
      // Always save locally first
      console.log('💾 Saving to IndexedDB...');
      await storage.saveDataset(dataset);
      console.log('✅ Saved to IndexedDB');
      
      // Update local state immediately
      setDatasets(prevDatasets => [...prevDatasets, dataset]);

      // Try to save to Supabase if we have a real project
      if (!currentProject.id.startsWith('temp-')) {
        console.log('☁️ Saving to Supabase...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
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
              user_id: session.user.id
            }])
            .select()
            .single();

          if (error) {
            console.warn('⚠️ Failed to save to Supabase:', error);
          } else {
            console.log('✅ Saved to Supabase:', data?.id);
          }
        }
      } else {
        console.log('ℹ️ Local project - skipping Supabase save');
      }

      return dataset;
    } catch (err) {
      console.error('❌ Error adding dataset:', err);
      throw err;
    }
  };

  const addModel = async (model: MLModel) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Authentication required to create models');
    }

    if (!currentProject?.id || currentProject.id.startsWith('temp-')) {
      throw new Error('Cannot create models in local project. Please sign in.');
    }

    try {
      const localDatasetId = model.datasetId;
      
      const { data, error } = await supabase
        .from('models')
        .insert([{
          name: model.name,
          description: model.description,
          model_type: model.modelType || 'classification',
          status: model.status,
          dataset_id: null,
          project_id: currentProject.id,
          user_id: session.user.id,
          hyperparameters: model.hyperparameters || {},
          training_config: {},
          metadata: {
            local_dataset_id: localDatasetId
          }
        }])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      const newModel: MLModel = {
        ...model,
        id: data.id,
        projectId: currentProject.id,
        createdAt: data.created_at,
        modelType: data.model_type,
        datasetId: localDatasetId
      };

      setModels(prevModels => [...prevModels, newModel]);
      return newModel;
    } catch (err) {
      console.error('Error adding model:', err);
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
      throw err;
    }
  };

  useEffect(() => {
    console.log('📌 Current project:', currentProject?.name || 'null');
  }, [currentProject]);

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