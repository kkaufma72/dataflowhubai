// RAG (Retrieval-Augmented Generation) Agent
// Intelligent document retrieval and knowledge management system
// Integrates with existing multi-agent architecture

import { z } from "zod";
import { Dataset } from '../../types';
import { UserProfile } from '../../utils/personalizedPrompts';

// ============================================================================
// RAG AGENT TYPES & INTERFACES
// ============================================================================

export interface RAGDocument {
  id: string;
  content: string;
  metadata: {
    type: 'dataset' | 'analysis' | 'documentation' | 'insight' | 'model';
    title: string;
    dataset_id?: string;
    user_id?: string;
    created_at: string;
    tags?: string[];
    source?: string;
    url?: string;
  };
  embedding?: number[];
}

export interface RAGQuery {
  query: string;
  filters?: {
    type?: string[];
    dataset_id?: string;
    user_id?: string;
    tags?: string[];
  };
  limit?: number;
  threshold?: number;
}

export interface RAGResult {
  documents: RAGDocument[];
  relevance_scores: number[];
  context: string;
  suggested_actions?: string[];
}

// ============================================================================
// RAG EMBEDDING & VECTOR OPERATIONS
// ============================================================================

export class RAGEmbeddingService {
  private apiKey: string;
  private model: string = 'text-embedding-3-small';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          input: text
        })
      });

      if (!response.ok) {
        throw new Error(`Embedding API failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// ============================================================================
// RAG DOCUMENT STORE
// ============================================================================

export class RAGDocumentStore {
  private documents: Map<string, RAGDocument> = new Map();
  private embeddingService: RAGEmbeddingService;

  constructor(apiKey: string) {
    this.embeddingService = new RAGEmbeddingService(apiKey);
  }

  async indexDocument(doc: Omit<RAGDocument, 'id' | 'embedding'>): Promise<string> {
    const id = `${doc.metadata.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Generate embedding for the document content
      const embedding = await this.embeddingService.generateEmbedding(doc.content);
      
      const document: RAGDocument = {
        ...doc,
        id,
        embedding
      };

      this.documents.set(id, document);
      console.log(`Indexed document: ${id} (${doc.metadata.type})`);
      return id;
    } catch (error) {
      console.error('Failed to index document:', error);
      throw error;
    }
  }

  async search(query: RAGQuery): Promise<RAGResult> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query.query);
      
      // Filter documents based on criteria
      const filteredDocs = Array.from(this.documents.values()).filter(doc => {
        if (query.filters?.type && !query.filters.type.includes(doc.metadata.type)) {
          return false;
        }
        if (query.filters?.dataset_id && doc.metadata.dataset_id !== query.filters.dataset_id) {
          return false;
        }
        if (query.filters?.user_id && doc.metadata.user_id !== query.filters.user_id) {
          return false;
        }
        if (query.filters?.tags && doc.metadata.tags) {
          const hasTag = query.filters.tags.some(tag => doc.metadata.tags?.includes(tag));
          if (!hasTag) return false;
        }
        return true;
      });

      // Calculate similarity scores
      const scoredDocs = filteredDocs
        .map(doc => ({
          document: doc,
          score: doc.embedding ? this.embeddingService.cosineSimilarity(queryEmbedding, doc.embedding) : 0
        }))
        .filter(item => item.score >= (query.threshold || 0.1))
        .sort((a, b) => b.score - a.score)
        .slice(0, query.limit || 10);

      // Combine relevant content into context
      const context = scoredDocs
        .slice(0, 5) // Top 5 most relevant
        .map(item => `${item.document.metadata.title}: ${item.document.content}`)
        .join('\n\n');

      // Generate suggested actions based on document types
      const suggested_actions = this.generateSuggestedActions(scoredDocs.map(item => item.document));

      return {
        documents: scoredDocs.map(item => item.document),
        relevance_scores: scoredDocs.map(item => item.score),
        context,
        suggested_actions
      };
    } catch (error) {
      console.error('RAG search failed:', error);
      return {
        documents: [],
        relevance_scores: [],
        context: '',
        suggested_actions: []
      };
    }
  }

  private generateSuggestedActions(documents: RAGDocument[]): string[] {
    const actions: string[] = [];
    const docTypes = new Set(documents.map(doc => doc.metadata.type));

    if (docTypes.has('dataset')) {
      actions.push('Analyze the dataset further with AI');
      actions.push('Create visualizations from this data');
    }
    if (docTypes.has('analysis')) {
      actions.push('Build upon this previous analysis');
      actions.push('Compare with other datasets');
    }
    if (docTypes.has('model')) {
      actions.push('Deploy this model');
      actions.push('Retrain with new data');
    }
    if (docTypes.has('documentation')) {
      actions.push('Follow the documented procedure');
      actions.push('Learn more about this feature');
    }

    return actions;
  }

  // Auto-index dataset content
  async indexDataset(dataset: Dataset, userId: string): Promise<void> {
    try {
      // Index dataset metadata
      await this.indexDocument({
        content: `Dataset: ${dataset.name}
Description: ${dataset.description || 'No description provided'}
File Type: ${dataset.fileType}
Row Count: ${dataset.rows || 'Unknown'}
Column Count: ${dataset.columns || 'Unknown'}
Upload Date: ${dataset.dateUploaded || 'Unknown'}
File Size: ${dataset.fileSize}`,
        metadata: {
          type: 'dataset',
          title: dataset.name,
          dataset_id: dataset.id,
          user_id: userId,
          created_at: dataset.dateUploaded || new Date().toISOString(),
          tags: ['dataset'],
          source: 'user_upload'
        }
      });

      // Index dataset preview data if available
      if (dataset.preview_data && dataset.preview_data.rows && dataset.preview_data.rows.length > 0) {
        const columns = dataset.preview_data.columns;
        const previewText = dataset.preview_data.rows
          .slice(0, 10) // First 10 rows
          .map(row => columns.map((col, index) => `${col}: ${row[index] || 'N/A'}`).join(', '))
          .join('\n');

        await this.indexDocument({
          content: `Sample data from ${dataset.name}:\nColumns: ${columns.join(', ')}\n${previewText}`,
          metadata: {
            type: 'dataset',
            title: `${dataset.name} - Sample Data`,
            dataset_id: dataset.id,
            user_id: userId,
            created_at: new Date().toISOString(),
            tags: ['preview'],
            source: 'dataset_preview'
          }
        });
      }

      console.log(`Successfully indexed dataset: ${dataset.name}`);
    } catch (error) {
      console.error('Failed to index dataset:', error);
    }
  }

  // Auto-index analysis results
  async indexAnalysis(
    question: string,
    answer: string,
    dataset: Dataset,
    userId: string,
    insights?: string[]
  ): Promise<void> {
    try {
      await this.indexDocument({
        content: `Analysis Question: ${question}
Answer: ${answer}
Dataset: ${dataset.name}
Insights: ${insights?.join('\n• ') || 'No specific insights generated'}`,
        metadata: {
          type: 'analysis',
          title: `Analysis: ${question.slice(0, 50)}...`,
          dataset_id: dataset.id,
          user_id: userId,
          created_at: new Date().toISOString(),
          tags: ['ai_analysis', 'qa'],
          source: 'ai_chat'
        }
      });

      console.log(`Indexed analysis for dataset: ${dataset.name}`);
    } catch (error) {
      console.error('Failed to index analysis:', error);
    }
  }

  // Get document by ID
  getDocument(id: string): RAGDocument | undefined {
    return this.documents.get(id);
  }

  // Get all documents for a user
  getUserDocuments(userId: string): RAGDocument[] {
    return Array.from(this.documents.values())
      .filter(doc => doc.metadata.user_id === userId);
  }

  // Clear documents (for testing)
  clear(): void {
    this.documents.clear();
  }
}

// ============================================================================
// RAG AGENT IMPLEMENTATION
// ============================================================================

export class RAGAgent {
  private documentStore: RAGDocumentStore;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.documentStore = new RAGDocumentStore(apiKey);
  }

  async initialize(): Promise<void> {
    // Initialize with platform documentation
    await this.indexPlatformDocumentation();
  }

  private async indexPlatformDocumentation(): Promise<void> {
    const docs = [
      {
        title: "Dataset Upload and Management",
        content: `DataFlowHub AI supports CSV, JSON, and Excel file uploads. After upload, datasets are automatically profiled for data quality, missing values, and statistical summaries. You can preview, filter, and transform your data using natural language commands.`,
        type: 'documentation' as const,
        tags: ['upload', 'csv', 'data-management']
      },
      {
        title: "AI Chat and Analysis",
        content: `Ask questions about your data in natural language. Our AI agents can perform statistical analysis, generate visualizations, find insights, and create marketing campaigns. Examples: "What are my top customers?", "Show sales trends", "Create a customer segmentation".`,
        type: 'documentation' as const,
        tags: ['ai-chat', 'analysis', 'natural-language']
      },
      {
        title: "Model Training and Deployment",
        content: `Build machine learning models with automated feature engineering, hyperparameter tuning, and model selection. Deploy models as REST APIs with one click. Monitor model performance and detect data drift automatically.`,
        type: 'documentation' as const,
        tags: ['ml', 'training', 'deployment', 'apis']
      },
      {
        title: "Visualization and Charts",
        content: `Create interactive charts and dashboards automatically. Supported chart types: line, bar, scatter, heatmap, histogram, box plot. Charts are generated based on data types and analysis context. Export as PNG, SVG, or PDF.`,
        type: 'documentation' as const,
        tags: ['charts', 'visualization', 'dashboard']
      },
      {
        title: "Marketing Intelligence Features",
        content: `Generate marketing copy using AIDA, PAS, FAB, and StoryBrand frameworks. Create customer personas, analyze campaign performance, and get strategic recommendations. Available for marketing, sales, and business analytics use cases.`,
        type: 'documentation' as const,
        tags: ['marketing', 'copywriting', 'campaigns', 'personas']
      }
    ];

    for (const doc of docs) {
      await this.documentStore.indexDocument({
        content: doc.content,
        metadata: {
          type: doc.type,
          title: doc.title,
          created_at: new Date().toISOString(),
          tags: doc.tags,
          source: 'platform_documentation'
        }
      });
    }
  }

  // Main RAG query method
  async query(
    question: string,
    dataset?: Dataset,
    userProfile?: UserProfile
  ): Promise<{
    answer: string;
    sources: RAGDocument[];
    confidence: number;
    suggested_actions: string[];
  }> {
    try {
      // Build search query with context
      const searchQuery: RAGQuery = {
        query: question,
        filters: {
          dataset_id: dataset?.id
        },
        limit: 10,
        threshold: 0.1
      };

      // Search for relevant documents
      const searchResult = await this.documentStore.search(searchQuery);

      if (searchResult.documents.length === 0) {
        return {
          answer: "I don't have specific information about that in my knowledge base. Could you provide more context or try asking about your datasets, previous analyses, or platform features?",
          sources: [],
          confidence: 0.0,
          suggested_actions: [
            'Upload a dataset to get started',
            'Ask about platform features',
            'Try a different question'
          ]
        };
      }

      // Generate contextual answer using RAG
      const contextualAnswer = await this.generateContextualAnswer(
        question,
        searchResult.context,
        dataset,
        userProfile
      );

      // Calculate confidence based on relevance scores
      const avgRelevance = searchResult.relevance_scores.length > 0 
        ? searchResult.relevance_scores.reduce((a, b) => a + b, 0) / searchResult.relevance_scores.length
        : 0;

      return {
        answer: contextualAnswer,
        sources: searchResult.documents.slice(0, 3), // Top 3 sources
        confidence: Math.min(avgRelevance * 2, 1.0), // Scale to 0-1
        suggested_actions: searchResult.suggested_actions || []
      };

    } catch (error) {
      console.error('RAG query failed:', error);
      return {
        answer: "I encountered an error while searching my knowledge base. Please try again or contact support if the issue persists.",
        sources: [],
        confidence: 0.0,
        suggested_actions: []
      };
    }
  }

  private async generateContextualAnswer(
    question: string,
    context: string,
    dataset?: Dataset,
    userProfile?: UserProfile
  ): Promise<string> {
    const systemPrompt = `You are a helpful AI assistant for DataFlowHub AI platform. Use the provided context to answer the user's question accurately and helpfully.

Context from knowledge base:
${context}

Instructions:
- Answer based on the provided context
- If context is insufficient, say so clearly
- Be specific and actionable
- Mention relevant features or capabilities
- Keep answers concise but complete
${userProfile ? `- User context: ${userProfile.job_title} in ${userProfile.company}, use case: ${userProfile.use_case}` : ''}
        ${dataset ? `- Current dataset: ${dataset.name} (${dataset.rows || 0} rows)` : ''}`;

    try {
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
            { role: 'user', content: question }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate contextual answer');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Unable to generate answer';

    } catch (error) {
      console.error('Failed to generate contextual answer:', error);
      return 'I found relevant information but had trouble processing it. Please try rephrasing your question.';
    }
  }

  // Public methods for integration
  async indexDataset(dataset: Dataset, userId: string): Promise<void> {
    return this.documentStore.indexDataset(dataset, userId);
  }

  async indexAnalysis(
    question: string,
    answer: string,
    dataset: Dataset,
    userId: string,
    insights?: string[]
  ): Promise<void> {
    return this.documentStore.indexAnalysis(question, answer, dataset, userId, insights);
  }

  getDocumentStore(): RAGDocumentStore {
    return this.documentStore;
  }
}

// ============================================================================
// RAG AGENT TOOLS FOR EXISTING SYSTEM
// ============================================================================

export const createRAGTools = (ragAgent: RAGAgent) => {
  return [
    {
      name: "search_knowledge_base",
      description: "Search the user's knowledge base for relevant information about datasets, previous analyses, or platform features",
      schema: z.object({
        query: z.string().describe("Search query or question"),
        filters: z.object({
          type: z.array(z.enum(['dataset', 'analysis', 'documentation', 'insight', 'model'])).optional(),
          dataset_id: z.string().optional(),
          tags: z.array(z.string()).optional()
        }).optional()
      }),
      func: async ({ query }: { query: string; filters?: any }) => {
        const result = await ragAgent.query(query);
        return {
          answer: result.answer,
          sources: result.sources.map(doc => ({
            title: doc.metadata.title,
            type: doc.metadata.type,
            created_at: doc.metadata.created_at
          })),
          confidence: result.confidence,
          suggested_actions: result.suggested_actions
        };
      }
    },
    {
      name: "get_similar_analyses",
      description: "Find similar analyses or questions from the user's history",
      schema: z.object({
        current_question: z.string().describe("Current question to find similar analyses for"),
        dataset_id: z.string().optional().describe("Limit to specific dataset")
      }),
      func: async ({ current_question, dataset_id }: { current_question: string; dataset_id?: string }) => {
        const searchResult = await ragAgent.getDocumentStore().search({
          query: current_question,
          filters: {
            type: ['analysis'],
            dataset_id
          },
          limit: 5
        });

        return {
          similar_analyses: searchResult.documents.map(doc => ({
            title: doc.metadata.title,
            content: doc.content.slice(0, 200) + '...',
            created_at: doc.metadata.created_at,
            relevance: searchResult.relevance_scores[searchResult.documents.indexOf(doc)]
          }))
        };
      }
    }
  ];
};

export default RAGAgent;
