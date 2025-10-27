// Enhanced Orchestrator with RAG Integration
// Coordinates multiple AI agents including the new RAG agent for intelligent knowledge retrieval

import { Dataset } from '../../types';
import { UserProfile } from '../../utils/personalizedPrompts';
// import { AgentResponse } from '../aiAgents'; // Not needed since we define our own interface
import { isMarketingUser, buildMarketingSystemPrompt } from './marketingAgent';
import RAGAgent from './ragAgent';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Classify user intent to determine what type of response is needed
 */
const classifyIntent = async (question: string) => {
  const marketingKeywords = ['marketing', 'campaign', 'customer', 'persona', 'copywrite', 'aida', 'pas', 'storybrand'];
  const chartKeywords = ['chart', 'graph', 'visualization', 'plot', 'show me'];
  const insightKeywords = ['insights', 'patterns', 'trends', 'analysis', 'discover'];

  const questionLower = question.toLowerCase();
  
  return {
    needsMarketing: marketingKeywords.some(keyword => questionLower.includes(keyword)),
    needsChart: chartKeywords.some(keyword => questionLower.includes(keyword)),
    needsInsights: insightKeywords.some(keyword => questionLower.includes(keyword))
  };
};

/**
 * Build analyst system prompt
 */
const buildAnalystPrompt = (context: any) => {
  return `You are an expert data analyst assistant. Analyze the provided dataset and answer the user's question with clear insights and actionable recommendations.

Dataset Context:
- Dataset: ${context.dataset?.name || 'Unknown'}
- Rows: ${context.dataset?.rows || 'Unknown'}
- Columns: ${context.dataset?.columns || 'Unknown'}

User Context:
- Role: ${context.userProfile?.job_title || 'Not specified'}
- Company: ${context.userProfile?.company || 'Not specified'}

Provide clear, data-driven insights with specific recommendations.`;
};

/**
 * Synthesize multiple agent responses into a single response
 */
const synthesizeAgentResponses = (responses: any[], userProfile: UserProfile): EnhancedAgentResponse => {
  const mainResponse = responses.find(r => r.type === 'analysis' || r.type === 'marketing') || responses[0];
  
  return {
    content: mainResponse?.content || 'No response available',
    charts: responses.filter(r => r.type === 'chart').map(r => r.content),
    insights: responses.filter(r => r.type === 'insight').map(r => r.content),
    actions: responses.filter(r => r.type === 'action').map(r => r.content),
    metadata: {
      userProfile,
      responseCount: responses.length
    }
  };
};

// ============================================================================
// ENHANCED ORCHESTRATOR WITH RAG
// ============================================================================

export interface EnhancedAgentResponse {
  content: string; // Using content instead of text for consistency with the chat
  rag_results?: {
    answer: string;
    sources: Array<{
      title: string;
      type: string;
      created_at: string;
    }>;
    confidence: number;
    suggested_actions: string[];
  };
  enhanced_context?: string;
  knowledge_sources?: number;
  type?: string;
  charts?: any[];
  insights?: string[];
  actions?: any[];
  metadata?: any;
}

export class EnhancedOrchestrator {
  private ragAgent: RAGAgent;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.ragAgent = new RAGAgent(apiKey);
  }

  async initialize(): Promise<void> {
    await this.ragAgent.initialize();
  }

  /**
   * Enhanced orchestrator that includes RAG capabilities
   */
  async runEnhancedAgentOrchestrator(
    question: string,
    dataset: Dataset,
    userProfile: UserProfile,
    conversationHistory: any[] = []
  ): Promise<EnhancedAgentResponse> {
    
    // Step 1: Check if RAG can help with this question
    const ragResult = await this.ragAgent.query(question, dataset, userProfile);
    
    // Step 2: Classify the intent (existing logic)
    const intent = await classifyIntent(question);

    // Step 3: Determine if RAG provides sufficient answer or if we need other agents
    const ragConfidenceThreshold = 0.7;
    const isKnowledgeQuery = this.isKnowledgeBasedQuery(question);
    
    if (ragResult.confidence >= ragConfidenceThreshold && isKnowledgeQuery) {
      // RAG can handle this query well
      return {
        content: ragResult.answer,
        rag_results: {
          answer: ragResult.answer,
          sources: ragResult.sources.map(doc => ({
            title: doc.metadata.title,
            type: doc.metadata.type,
            created_at: doc.metadata.created_at
          })),
          confidence: ragResult.confidence,
          suggested_actions: ragResult.suggested_actions
        },
        enhanced_context: "Retrieved from knowledge base",
        knowledge_sources: ragResult.sources.length,
        type: "rag_response"
      };
    }

    // Step 4: Use RAG context to enhance other agents
    const enhancedContext = ragResult.sources.length > 0 
      ? `\nRelevant context from knowledge base:\n${ragResult.sources.map(s => s.metadata.title).join(', ')}`
      : '';

    // Step 5: Prepare enhanced context for agents
    const context = {
      dataset,
      userProfile,
      conversationHistory,
      intent,
      ragContext: ragResult.sources.length > 0 ? ragResult.answer : undefined
    };

    // Step 6: Route to appropriate agents with enhanced context
    const responses: any[] = [];

    try {
      // Build enhanced system prompt
      let systemPrompt = "";
      
      if (intent.needsMarketing || isMarketingUser(userProfile)) {
        systemPrompt = buildMarketingSystemPrompt(userProfile, dataset) + enhancedContext;
      } else {
        systemPrompt = buildAnalystPrompt(context) + enhancedContext;
      }

      // Add RAG context if available
      if (ragResult.sources.length > 0) {
        systemPrompt += `\n\nAdditional Context: ${ragResult.answer}`;
      }

      // Call OpenAI API with enhanced context
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: question }
          ],
          temperature: 0.7,
          max_tokens: 1200
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'No response generated';
      
      responses.push({ 
        type: intent.needsMarketing ? "marketing" : "analysis", 
        content: aiResponse
      });

      // Store this analysis in RAG for future reference
      if (dataset) {
        // Use a fallback user ID since UserProfile doesn't have an id field
        await this.ragAgent.indexAnalysis(question, aiResponse, dataset, 'current-user');
      }

    } catch (error: any) {
      console.error('Enhanced AI agent error:', error);
      responses.push({
        type: "error",
        content: `I'm having trouble connecting right now. ${error.message || 'Please try again in a moment.'}`
      });
    }

    // Handle other agent types (chart, insights) if needed
    if (intent.needsChart) {
      responses.push({ type: "chart", content: "Enhanced chart will be generated with RAG context" });
    }

    if (intent.needsInsights) {
      responses.push({ type: "insight", content: "Enhanced insights discovered with knowledge base" });
    }

    // Fallback response
    if (responses.length === 0) {
      let fallbackContent = `I can help you with:\n• Data analysis and statistics\n• Chart creation and visualization\n• Insight discovery and patterns${isMarketingUser(userProfile) ? '\n• Marketing strategy and campaigns\n• Customer personas and segmentation\n• Copywriting and content creation' : ''}\n\nWhat would you like to explore?`;
      
      if (ragResult.suggested_actions.length > 0) {
        fallbackContent += `\n\nSuggested actions based on your data:\n• ${ragResult.suggested_actions.join('\n• ')}`;
      }

      responses.push({
        type: "fallback",
        content: fallbackContent
      });
    }

    // Synthesize all responses with RAG enhancement
    const synthesizedResponse = synthesizeAgentResponses(responses, userProfile);
    
    return {
      ...synthesizedResponse,
      rag_results: ragResult.sources.length > 0 ? {
        answer: ragResult.answer,
        sources: ragResult.sources.map(doc => ({
          title: doc.metadata.title,
          type: doc.metadata.type,
          created_at: doc.metadata.created_at
        })),
        confidence: ragResult.confidence,
        suggested_actions: ragResult.suggested_actions
      } : undefined,
      enhanced_context: enhancedContext,
      knowledge_sources: ragResult.sources.length
    };
  }

  /**
   * Determine if a query is primarily knowledge-based
   */
  private isKnowledgeBasedQuery(question: string): boolean {
    const knowledgePatterns = [
      /how to/i,
      /what is/i,
      /explain/i,
      /documentation/i,
      /help with/i,
      /tutorial/i,
      /guide/i,
      /previous analysis/i,
      /similar/i,
      /history/i,
      /remember/i,
      /feature/i,
      /capability/i
    ];

    return knowledgePatterns.some(pattern => pattern.test(question));
  }

  /**
   * Auto-index a dataset when uploaded
   */
  async onDatasetUploaded(dataset: Dataset, userId: string): Promise<void> {
    try {
      await this.ragAgent.indexDataset(dataset, userId);
      console.log(`Auto-indexed dataset: ${dataset.name} for user: ${userId}`);
    } catch (error) {
      console.error('Failed to auto-index dataset:', error);
    }
  }

  /**
   * Get suggested questions based on user's knowledge base
   */
  async getSuggestedQuestions(dataset?: Dataset, userProfile?: UserProfile): Promise<string[]> {
    const baseQuestions = [
      "What insights can you find in my data?",
      "Show me the key statistics",
      "What are the main patterns?",
      "How can I improve data quality?"
    ];

    if (!dataset || !userProfile) return baseQuestions;

    try {
      // Get user's document history to suggest personalized questions
      const userDocs = this.ragAgent.getDocumentStore().getUserDocuments('current-user');
      
      if (userDocs.length === 0) return baseQuestions;

      // Analyze document types and suggest relevant questions
      const hasAnalyses = userDocs.some(doc => doc.metadata.type === 'analysis');
      const hasModels = userDocs.some(doc => doc.metadata.type === 'model');
      
      const suggestedQuestions = [...baseQuestions];
      
      if (hasAnalyses) {
        suggestedQuestions.push("What similar analyses have I done before?");
        suggestedQuestions.push("Compare this with my previous datasets");
      }
      
      if (hasModels) {
        suggestedQuestions.push("Can I use my existing models on this data?");
        suggestedQuestions.push("What's the best model for this dataset?");
      }

      if (isMarketingUser(userProfile)) {
        suggestedQuestions.push("Generate customer personas from this data");
        suggestedQuestions.push("Create marketing copy for these insights");
      }

      return suggestedQuestions.slice(0, 6); // Return top 6
    } catch (error) {
      console.error('Failed to generate suggested questions:', error);
      return baseQuestions;
    }
  }

  /**
   * Search knowledge base directly (for UI search functionality)
   */
  async searchKnowledgeBase(
    query: string, 
    userId?: string, 
    datasetId?: string
  ): Promise<{
    results: Array<{
      title: string;
      content: string;
      type: string;
      created_at: string;
      relevance: number;
    }>;
    total: number;
  }> {
    try {
      const searchResult = await this.ragAgent.getDocumentStore().search({
        query,
        filters: {
          user_id: userId,
          dataset_id: datasetId
        },
        limit: 20
      });

      return {
        results: searchResult.documents.map((doc, index) => ({
          title: doc.metadata.title,
          content: doc.content.slice(0, 200) + (doc.content.length > 200 ? '...' : ''),
          type: doc.metadata.type,
          created_at: doc.metadata.created_at,
          relevance: searchResult.relevance_scores[index] || 0
        })),
        total: searchResult.documents.length
      };
    } catch (error) {
      console.error('Knowledge base search failed:', error);
      return { results: [], total: 0 };
    }
  }

  /**
   * Get RAG agent instance for external use
   */
  getRagAgent(): RAGAgent {
    return this.ragAgent;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create global enhanced orchestrator instance
 */
let globalOrchestrator: EnhancedOrchestrator | null = null;

/**
 * ⚠️ SECURITY WARNING: This orchestrator is temporarily disabled
 * 
 * The EnhancedOrchestrator requires significant refactoring to work with
 * the new secure Edge Function architecture. 
 * 
 * Use runAgentOrchestrator() from aiAgents.ts instead, which is now secure.
 * 
 * TODO: Refactor RAGAgent and EnhancedOrchestrator to use Edge Functions
 */
export const getEnhancedOrchestrator = async (): Promise<EnhancedOrchestrator> => {
  throw new Error(
    'EnhancedOrchestrator is temporarily disabled for security reasons. ' +
    'Use runAgentOrchestrator() from aiAgents.ts instead.'
  );
  
  // Original code disabled:
  // if (!globalOrchestrator) {
  //   const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  //   if (!apiKey) {
  //     throw new Error('OpenAI API key not configured');
  //   }
  //   
  //   globalOrchestrator = new EnhancedOrchestrator(apiKey);
  //   await globalOrchestrator.initialize();
  // }
  // 
  // return globalOrchestrator;
};

/**
 * Enhanced version of the original runAgentOrchestrator function
 * Drop-in replacement that adds RAG capabilities
 */
export const runEnhancedAgentOrchestrator = async (
  question: string,
  dataset: Dataset,
  userProfile: UserProfile,
  conversationHistory: any[] = []
): Promise<EnhancedAgentResponse> => {
  const orchestrator = await getEnhancedOrchestrator();
  return orchestrator.runEnhancedAgentOrchestrator(question, dataset, userProfile, conversationHistory);
};

export default EnhancedOrchestrator;
