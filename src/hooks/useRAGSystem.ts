// useRAGSystem Hook
// Manages RAG agent integration and provides utilities for knowledge retrieval

import { useState, useEffect, useCallback } from 'react';
import { Dataset } from '../types';
import { UserProfile } from '../utils/personalizedPrompts';
import { getEnhancedOrchestrator, EnhancedOrchestrator } from '../lib/agents/enhancedOrchestrator';
import { useAuth } from '../components/auth/AuthProvider';

interface RAGSearchResult {
  results: Array<{
    title: string;
    content: string;
    type: string;
    created_at: string;
    relevance: number;
  }>;
  total: number;
}

interface RAGSystemState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  orchestrator: EnhancedOrchestrator | null;
}

interface UseRAGSystemReturn {
  // State
  initialized: boolean;
  loading: boolean;
  error: string | null;

  // Core functions
  searchKnowledge: (query: string, datasetId?: string) => Promise<RAGSearchResult>;
  getSuggestedQuestions: (dataset?: Dataset, userProfile?: UserProfile) => Promise<string[]>;
  
  // Auto-indexing functions
  indexDataset: (dataset: Dataset) => Promise<void>;
  indexAnalysis: (question: string, answer: string, dataset: Dataset, insights?: string[]) => Promise<void>;
  
  // Utility functions
  initialize: () => Promise<void>;
  getOrchestrator: () => EnhancedOrchestrator | null;
}

export const useRAGSystem = (): UseRAGSystemReturn => {
  const { user } = useAuth();
  const [state, setState] = useState<RAGSystemState>({
    initialized: false,
    loading: false,
    error: null,
    orchestrator: null
  });

  // Initialize the RAG system
  const initialize = useCallback(async () => {
    if (state.initialized || state.loading) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const orchestrator = await getEnhancedOrchestrator();
      setState(prev => ({
        ...prev,
        initialized: true,
        loading: false,
        orchestrator
      }));
    } catch (error: any) {
      console.error('Failed to initialize RAG system:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to initialize RAG system'
      }));
    }
  }, [state.initialized, state.loading]);

  // Auto-initialize on component mount
  useEffect(() => {
    if (user && !state.initialized) {
      initialize();
    }
  }, [user, initialize, state.initialized]);

  // Search knowledge base
  const searchKnowledge = useCallback(async (
    query: string, 
    datasetId?: string
  ): Promise<RAGSearchResult> => {
    if (!state.orchestrator) {
      throw new Error('RAG system not initialized');
    }

    try {
      return await state.orchestrator.searchKnowledgeBase(query, user?.id, datasetId);
    } catch (error: any) {
      console.error('Knowledge search failed:', error);
      throw new Error(error.message || 'Knowledge search failed');
    }
  }, [state.orchestrator, user?.id]);

  // Get suggested questions
  const getSuggestedQuestions = useCallback(async (
    dataset?: Dataset, 
    userProfile?: UserProfile
  ): Promise<string[]> => {
    if (!state.orchestrator) {
      console.warn('RAG system not initialized, returning default questions');
      return [
        "What insights can you find in my data?",
        "Show me the key statistics",
        "What are the main patterns?",
        "How can I improve data quality?"
      ];
    }

    try {
      return await state.orchestrator.getSuggestedQuestions(dataset, userProfile);
    } catch (error: any) {
      console.error('Failed to get suggested questions:', error);
      return [
        "What insights can you find in my data?",
        "Show me the key statistics",
        "What are the main patterns?",
        "How can I improve data quality?"
      ];
    }
  }, [state.orchestrator]);

  // Index a dataset
  const indexDataset = useCallback(async (dataset: Dataset): Promise<void> => {
    if (!state.orchestrator || !user?.id) {
      console.warn('Cannot index dataset: RAG system not initialized or user not authenticated');
      return;
    }

    try {
      await state.orchestrator.onDatasetUploaded(dataset, user.id);
      console.log(`Successfully indexed dataset: ${dataset.name}`);
    } catch (error: any) {
      console.error('Failed to index dataset:', error);
      throw new Error(error.message || 'Failed to index dataset');
    }
  }, [state.orchestrator, user?.id]);

  // Index an analysis
  const indexAnalysis = useCallback(async (
    question: string,
    answer: string,
    dataset: Dataset,
    insights?: string[]
  ): Promise<void> => {
    if (!state.orchestrator || !user?.id) {
      console.warn('Cannot index analysis: RAG system not initialized or user not authenticated');
      return;
    }

    try {
      await state.orchestrator.getRagAgent().indexAnalysis(
        question,
        answer,
        dataset,
        user.id,
        insights
      );
      console.log('Successfully indexed analysis');
    } catch (error: any) {
      console.error('Failed to index analysis:', error);
      // Don't throw error here as it's a background operation
    }
  }, [state.orchestrator, user?.id]);

  // Get orchestrator instance
  const getOrchestrator = useCallback((): EnhancedOrchestrator | null => {
    return state.orchestrator;
  }, [state.orchestrator]);

  return {
    // State
    initialized: state.initialized,
    loading: state.loading,
    error: state.error,

    // Core functions
    searchKnowledge,
    getSuggestedQuestions,

    // Auto-indexing functions
    indexDataset,
    indexAnalysis,

    // Utility functions
    initialize,
    getOrchestrator
  };
};

// Higher-order component to provide RAG system to child components
export interface WithRAGSystemProps {
  ragSystem: UseRAGSystemReturn;
}

export default useRAGSystem;
