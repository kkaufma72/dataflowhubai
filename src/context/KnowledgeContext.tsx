/**
 * Knowledge Context Provider
 * 
 * Global context for accessing dataset knowledge across the app.
 * Provides semantic search, recent insights, and AI context.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Dataset } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { searchKnowledge, SearchResult } from '../lib/embeddingService';
import { getDatasetKnowledge, DatasetKnowledge, DatasetStory } from '../lib/datasetKnowledge';

interface KnowledgeContextType {
  // Current dataset knowledge
  currentDatasetId: string | null;
  setCurrentDatasetId: (id: string | null) => void;
  currentKnowledge: DatasetKnowledge | null;
  
  // Global search
  searchAllKnowledge: (query: string, userId?: string) => Promise<SearchResult[]>;
  
  // Recent activity
  recentInsights: { datasetId: string; datasetName: string; question: string; answer: string }[];
  recentStories: (DatasetStory & { datasetId: string; datasetName: string })[];
  
  // Loading state
  isLoading: boolean;
  
  // Build AI context
  buildAIContext: (datasetId?: string) => Promise<string>;
}

const KnowledgeContext = createContext<KnowledgeContextType | null>(null);

export const useKnowledge = () => {
  const context = useContext(KnowledgeContext);
  if (!context) {
    throw new Error('useKnowledge must be used within KnowledgeProvider');
  }
  return context;
};

interface KnowledgeProviderProps {
  children: ReactNode;
}

export const KnowledgeProvider: React.FC<KnowledgeProviderProps> = ({ children }) => {
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);
  const [currentKnowledge, setCurrentKnowledge] = useState<DatasetKnowledge | null>(null);
  const [recentInsights, setRecentInsights] = useState<KnowledgeContextType['recentInsights']>([]);
  const [recentStories, setRecentStories] = useState<KnowledgeContextType['recentStories']>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load knowledge when dataset changes
  useEffect(() => {
    if (!currentDatasetId || !isSupabaseConfigured) {
      setCurrentKnowledge(null);
      return;
    }

    const loadKnowledge = async () => {
      setIsLoading(true);
      try {
        const knowledge = await getDatasetKnowledge(currentDatasetId);
        setCurrentKnowledge(knowledge);
      } catch (e) {
        console.error('Failed to load knowledge:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadKnowledge();
  }, [currentDatasetId]);

  // Load recent activity on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const loadRecentActivity = async () => {
      try {
        // Fetch recent knowledge entries with insights
        const { data: knowledgeData } = await supabase
          .from('dataset_knowledge')
          .select('dataset_id, dataset_name, analysis_history, stories')
          .order('updated_at', { ascending: false })
          .limit(10);

        if (knowledgeData) {
          // Extract recent insights
          const insights: KnowledgeContextType['recentInsights'] = [];
          const stories: KnowledgeContextType['recentStories'] = [];

          knowledgeData.forEach(item => {
            // Get last 2 insights per dataset
            const history = item.analysis_history || [];
            history.slice(-2).forEach((h: any) => {
              insights.push({
                datasetId: item.dataset_id,
                datasetName: item.dataset_name || 'Unknown',
                question: h.question,
                answer: h.answer
              });
            });

            // Get recent stories
            const datasetStories = item.stories || [];
            datasetStories.slice(-2).forEach((s: any) => {
              stories.push({
                ...s,
                datasetId: item.dataset_id,
                datasetName: item.dataset_name || 'Unknown'
              });
            });
          });

          setRecentInsights(insights.slice(0, 10));
          setRecentStories(stories.slice(0, 10));
        }
      } catch (e) {
        console.error('Failed to load recent activity:', e);
      }
    };

    loadRecentActivity();
  }, []);

  // Global semantic search
  const searchAllKnowledge = useCallback(async (query: string, userId?: string): Promise<SearchResult[]> => {
    if (!isSupabaseConfigured) return [];

    try {
      return await searchKnowledge(query, {
        userId,
        matchThreshold: 0.5,
        matchCount: 10
      });
    } catch (e) {
      console.error('Knowledge search failed:', e);
      return [];
    }
  }, []);

  // Build comprehensive AI context
  const buildAIContext = useCallback(async (datasetId?: string): Promise<string> => {
    const contextParts: string[] = [];

    // Add current dataset knowledge
    const knowledge = datasetId ? await getDatasetKnowledge(datasetId) : currentKnowledge;
    
    if (knowledge) {
      if (knowledge.businessContext) {
        contextParts.push(`## Business Context\n${knowledge.businessContext}`);
      }

      if (knowledge.knownIssues?.length) {
        contextParts.push(`## Known Issues\n${knowledge.knownIssues.map(i => `- ${i}`).join('\n')}`);
      }

      if (knowledge.dataDictionary?.columns?.length) {
        const colDefs = knowledge.dataDictionary.columns
          .filter(c => c.businessMeaning)
          .map(c => `- **${c.name}**: ${c.businessMeaning}`)
          .join('\n');
        if (colDefs) {
          contextParts.push(`## Column Definitions\n${colDefs}`);
        }
      }

      if (knowledge.domainContext) {
        contextParts.push(`## Domain Context\n${knowledge.domainContext}`);
      }

      // Add recent insights
      if (knowledge.analysisHistory?.length) {
        const recent = knowledge.analysisHistory.slice(-3);
        const insightText = recent.map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n\n');
        contextParts.push(`## Previous Insights\n${insightText}`);
      }
    }

    // Add recent global activity for context
    if (recentInsights.length) {
      const globalInsights = recentInsights
        .slice(0, 3)
        .map(i => `- From "${i.datasetName}": ${i.answer.substring(0, 100)}...`)
        .join('\n');
      contextParts.push(`## Related Insights from Other Datasets\n${globalInsights}`);
    }

    return contextParts.length > 0 
      ? `# Knowledge Context\n\n${contextParts.join('\n\n')}`
      : '';
  }, [currentKnowledge, recentInsights]);

  const value: KnowledgeContextType = {
    currentDatasetId,
    setCurrentDatasetId,
    currentKnowledge,
    searchAllKnowledge,
    recentInsights,
    recentStories,
    isLoading,
    buildAIContext
  };

  return (
    <KnowledgeContext.Provider value={value}>
      {children}
    </KnowledgeContext.Provider>
  );
};

export default KnowledgeProvider;

