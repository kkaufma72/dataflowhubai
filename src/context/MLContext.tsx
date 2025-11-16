import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { supabase, initializeSupabase, handleSupabaseError } from '../lib/supabase';
import { Dataset, MLModel } from '../types';
import { storage } from '../lib/storage';
import { generateSampleDatasets } from '../lib/sampleData';
import { useAuth } from '../components/auth/AuthProvider';

interface MLContextType {
  datasets: Dataset[];
  models: MLModel[];
  isLoading: boolean;
  error: string | null;
  addDataset: (dataset: Dataset) => Promise<Dataset>;
  updateDataset: (id: string, updates: Partial<Dataset>) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
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
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<MLModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const initializeSampleData = async () => {
    try {
      let localDatasets = await storage.getAllDatasets();
      
      if (localDatasets.length === 0) {
        console.log('Initializing sample datasets...');
        const sampleDatasets = generateSampleDatasets();
        // Convert SampleDataset to Dataset format
        const convertedDatasets: Dataset[] = sampleDatasets.map(sd => ({
          id: sd.id,
          name: sd.name,
          description: sd.description,
          rows: sd.row_count,
          columns: sd.column_count,
          dateUploaded: sd.dateUploaded,
          fileType: sd.file_type,
          fileSize: sd.file_size,
          projectId: sd.project_id,
          preview_data: sd.preview_data
        }));
        await Promise.all(convertedDatasets.map(dataset => storage.saveDataset(dataset)));
        localDatasets = convertedDatasets;
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
      const [datasetsResponse, modelsResponse, localDatasets] = await Promise.all([
        supabaseFetch(
          `/rest/v1/datasets?user_id=eq.${user.id}&select=id,name,description,row_count,column_count,file_type,file_size,created_at,user_id,preview_data&order=created_at.desc`,
          { method: 'GET' }
        ),
        supabaseFetch(
          `/rest/v1/models?user_id=eq.${user.id}&select=*&order=created_at.desc`,
          { method: 'GET' }
        ),
        initializeSampleData()
      ]);

      // Parse fetch responses
      const remoteDatasets = datasetsResponse.ok ? await datasetsResponse.json() : [];
      const remoteModels = modelsResponse.ok ? await modelsResponse.json() : [];

      // Merge local and remote datasets - OPTIMIZED from O(n²) to O(n)
      const localIds = new Set(localDatasets.map(d => d.id));
      const mergedDatasets = [
        ...localDatasets,
        ...remoteDatasets.filter((d: any) => !localIds.has(d.id))
      ];

      setDatasets(mergedDatasets);
      setModels(remoteModels);
      setIsLoading(false);
      setHasFetched(true);

      // Auto-load sample data for new users with no datasets
      // ONLY do this once by checking localStorage flag
      if (mergedDatasets.length === 0 && user?.id) {
        const hasSeededKey = `hasSeededDatasets_${user.id}`;
        const hasSeeded = localStorage.getItem(hasSeededKey);
        
        if (!hasSeeded) {
          console.log('🎯 New user detected - auto-loading sample data...');
          try {
            const { seedEnhancedDatasets } = await import('../utils/seedDatasets');
            // Pass null for project_id since we removed projects
            await seedEnhancedDatasets(user.id, null);
            
            // Mark as seeded to prevent duplicate runs
            localStorage.setItem(hasSeededKey, 'true');
            
            // Refresh datasets after seeding
            const refreshResponse = await supabaseFetch(
              `/rest/v1/datasets?user_id=eq.${user.id}&select=id,name,description,row_count,column_count,file_type,file_size,created_at,user_id,preview_data&order=created_at.desc`,
              { method: 'GET' }
            );
            
            if (refreshResponse.ok) {
              const refreshedDatasets = await refreshResponse.json();
              setDatasets(refreshedDatasets);
              console.log('✅ Sample data loaded for new user');
            }
          } catch (seedError) {
            console.warn('Could not auto-load sample data:', seedError);
            // Don't throw - this is optional
          }
        } else {
          console.log('ℹ️ User already has seeded data flag set');
        }
      }

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      // Reset data when auth state changes
      if (session) {
        setHasFetched(false); // Reset to allow refetch
      } else {
        setDatasets([]);
        setModels([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const addDataset = useCallback(async (dataset: Dataset): Promise<Dataset> => {
    try {
      // Try to save to IndexedDB but don't fail if it hangs
      await storage.saveDataset(dataset);
    } catch (error) {
      console.warn('⚠️ IndexedDB save failed, continuing anyway:', error);
      // Don't throw - we still want to add to state
    }
    
    // Always update state regardless of IndexedDB result
    setDatasets(prev => [dataset, ...prev]);
    return dataset;
  }, []);

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

  const addModel = useCallback((model: MLModel) => {
    setModels(prev => [model, ...prev]);
  }, []);

  const updateModelStatus = useCallback((id: string, status: string, metrics?: Record<string, number>) => {
    setModels(prev =>
      prev.map(model =>
        model.id === id
          ? { ...model, status: status as MLModel['status'], ...(metrics && { metrics }) }
          : model
      )
    );
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    datasets,
    models,
    isLoading,
    error,
    addDataset,
    updateDataset,
    deleteDataset,
    addModel,
    updateModelStatus,
  }), [datasets, models, isLoading, error, addDataset, updateDataset, deleteDataset, addModel, updateModelStatus]);

  return <MLContext.Provider value={value}>{children}</MLContext.Provider>;
};

export default MLProvider;