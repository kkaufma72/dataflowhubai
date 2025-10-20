import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { supabase, initializeSupabase, handleSupabaseError } from '../lib/supabase';
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
  const [hasFetched, setHasFetched] = useState(false);

  const createDefaultProject = async (userId: string) => {
    try {
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert([{
          name: 'Default Project',
          description: 'Default project created automatically',
          user_id: userId
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
      let localDatasets = await storage.getAllDatasets();
      
      if (localDatasets.length === 0) {
        console.log('Initializing sample datasets...');
        const sampleDatasets = generateSampleDatasets();
        await Promise.all(sampleDatasets.map(dataset => storage.saveDataset(dataset)));
        localDatasets = sampleDatasets;
        console.log('Sample datasets initialized:', localDatasets.length);
      }

      return localDatasets;
    } catch (error) {
      console.error('Error initializing sample data:', error);
      return [];
    }
  };

  const loadInitialData = useCallback(async () => {
    // Prevent multiple calls
    if (hasFetched) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
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

      // OPTIMIZATION: Single query to get or create project
      let { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (projectError) throw projectError;

      let project = projects?.[0];
      
      if (!project) {
        project = await createDefaultProject(session.user.id);
      }

      if (!project) {
        throw new Error('Failed to load or create project');
      }

      setCurrentProject({
        id: project.id,
        name: project.name,
        description: project.description || '',
        createdAt: project.created_at
      });

      // OPTIMIZATION: Parallel fetch of datasets and models (2 requests instead of many)
      const [datasetsResponse, modelsResponse, localDatasets] = await Promise.all([
        supabase
          .from('datasets')
          .select('id, name, description, row_count, column_count, file_type, file_size, created_at, project_id, user_id')
          .eq('project_id', project.id)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('models')
          .select('*')
          .eq('project_id', project.id)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        initializeSampleData()
      ]);

      if (datasetsResponse.error) throw datasetsResponse.error;
      if (modelsResponse.error) throw modelsResponse.error;

      // Merge local and remote datasets
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
      setIsLoading(false);
      setHasFetched(true);

    } catch (err) {
      console.error('Error loading initial data:', err);
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [hasFetched]);

  // Only load data once on mount
  useEffect(() => {
    if (!hasFetched) {
      loadInitialData();
    }
  }, [hasFetched, loadInitialData]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setHasFetched(false); // Reset to allow refetch
      } else if (event === 'SIGNED_OUT') {
        setDatasets([]);
        setModels([]);
        setCurrentProject(null);
        setHasFetched(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const addDataset = async (dataset: Dataset): Promise<Dataset> => {
    try {
      await storage.saveDataset(dataset);
      setDatasets(prev => [dataset, ...prev]);
      return dataset;
    } catch (error) {
      console.error('Error adding dataset:', error);
      throw error;
    }
  };

  const addModel = useCallback((model: MLModel) => {
    setModels(prev => [model, ...prev]);
  }, []);

  const updateModelStatus = useCallback((id: string, status: string, metrics?: Record<string, number>) => {
    setModels(prev =>
      prev.map(model =>
        model.id === id
          ? { ...model, status, ...(metrics && { metrics }) }
          : model
      )
    );
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    currentProject,
    datasets,
    models,
    isLoading,
    error,
    setCurrentProject,
    addDataset,
    addModel,
    updateModelStatus
  }), [currentProject, datasets, models, isLoading, error, addModel, updateModelStatus]);

  return <MLContext.Provider value={value}>{children}</MLContext.Provider>;
};

export default MLProvider;