/**
 * Embedding Service
 * 
 * Generates and manages vector embeddings for semantic search.
 * Uses OpenAI's text-embedding-ada-002 model via Supabase Edge Function.
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface KnowledgeChunk {
  id?: string;
  datasetId: string;
  userId?: string;
  chunkType: 'story' | 'column_def' | 'insight' | 'context' | 'question';
  chunkText: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  datasetId: string;
  datasetName?: string;
  chunkType: string;
  chunkText: string;
  similarity: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

/**
 * Generate embedding for text using Supabase Edge Function
 */
export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { text }
    });

    if (error) {
      console.error('Embedding generation error:', error);
      return null;
    }

    return data?.embedding || null;
  } catch (e) {
    console.error('Failed to generate embedding:', e);
    return null;
  }
};

/**
 * Generate embeddings for multiple texts (batched)
 */
export const generateEmbeddings = async (texts: string[]): Promise<(number[] | null)[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { texts }
    });

    if (error) {
      console.error('Batch embedding generation error:', error);
      return texts.map(() => null);
    }

    return data?.embeddings || texts.map(() => null);
  } catch (e) {
    console.error('Failed to generate embeddings:', e);
    return texts.map(() => null);
  }
};

// ============================================================================
// CHUNK MANAGEMENT
// ============================================================================

/**
 * Store a knowledge chunk with its embedding
 */
export const storeKnowledgeChunk = async (chunk: KnowledgeChunk): Promise<boolean> => {
  try {
    // Generate embedding if not provided
    let embedding = chunk.embedding;
    if (!embedding) {
      embedding = await generateEmbedding(chunk.chunkText) || undefined;
    }

    const { error } = await supabase
      .from('knowledge_chunks')
      .insert({
        dataset_id: chunk.datasetId,
        user_id: chunk.userId,
        chunk_type: chunk.chunkType,
        chunk_text: chunk.chunkText,
        metadata: chunk.metadata || {},
        embedding: embedding ? `[${embedding.join(',')}]` : null
      });

    if (error) {
      console.error('Failed to store chunk:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error storing chunk:', e);
    return false;
  }
};

/**
 * Store multiple chunks (batched for efficiency)
 */
export const storeKnowledgeChunks = async (chunks: KnowledgeChunk[]): Promise<number> => {
  if (chunks.length === 0) return 0;

  try {
    // Generate embeddings for all chunks
    const texts = chunks.map(c => c.chunkText);
    const embeddings = await generateEmbeddings(texts);

    // Prepare insert data
    const insertData = chunks.map((chunk, idx) => ({
      dataset_id: chunk.datasetId,
      user_id: chunk.userId,
      chunk_type: chunk.chunkType,
      chunk_text: chunk.chunkText,
      metadata: chunk.metadata || {},
      embedding: embeddings[idx] ? `[${embeddings[idx]!.join(',')}]` : null
    }));

    const { error, data } = await supabase
      .from('knowledge_chunks')
      .insert(insertData)
      .select('id');

    if (error) {
      console.error('Failed to store chunks:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (e) {
    console.error('Error storing chunks:', e);
    return 0;
  }
};

/**
 * Delete all chunks for a dataset
 */
export const deleteDatasetChunks = async (datasetId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('dataset_id', datasetId);

    return !error;
  } catch (e) {
    console.error('Error deleting chunks:', e);
    return false;
  }
};

// ============================================================================
// SEMANTIC SEARCH
// ============================================================================

/**
 * Search for similar knowledge chunks
 */
export const searchKnowledge = async (
  query: string,
  options: {
    datasetId?: string;
    userId?: string;
    matchThreshold?: number;
    matchCount?: number;
  } = {}
): Promise<SearchResult[]> => {
  const {
    datasetId,
    userId,
    matchThreshold = 0.7,
    matchCount = 5
  } = options;

  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) {
      console.warn('Could not generate query embedding, falling back to text search');
      return fallbackTextSearch(query, datasetId, matchCount);
    }

    // Call the search function
    const { data, error } = await supabase.rpc('search_knowledge_chunks', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_dataset_id: datasetId || null
    });

    if (error) {
      console.error('Semantic search error:', error);
      return fallbackTextSearch(query, datasetId, matchCount);
    }

    return (data || []).map((row: any) => ({
      datasetId: row.dataset_id,
      chunkType: row.chunk_type,
      chunkText: row.chunk_text,
      similarity: row.similarity,
      metadata: row.metadata
    }));
  } catch (e) {
    console.error('Search error:', e);
    return fallbackTextSearch(query, datasetId, matchCount);
  }
};

/**
 * Search across all knowledge for a user
 */
export const searchAllKnowledge = async (
  query: string,
  userId: string,
  matchCount: number = 10
): Promise<SearchResult[]> => {
  try {
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) {
      return [];
    }

    const { data, error } = await supabase.rpc('search_all_knowledge', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      p_user_id: userId,
      match_count: matchCount
    });

    if (error) {
      console.error('Global search error:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      datasetId: row.dataset_id,
      datasetName: row.dataset_name,
      chunkType: row.chunk_type,
      chunkText: row.chunk_text,
      similarity: row.similarity
    }));
  } catch (e) {
    console.error('Global search error:', e);
    return [];
  }
};

/**
 * Fallback text search when embeddings fail
 */
const fallbackTextSearch = async (
  query: string,
  datasetId?: string,
  limit: number = 5
): Promise<SearchResult[]> => {
  try {
    let queryBuilder = supabase
      .from('knowledge_chunks')
      .select('*')
      .ilike('chunk_text', `%${query}%`)
      .limit(limit);

    if (datasetId) {
      queryBuilder = queryBuilder.eq('dataset_id', datasetId);
    }

    const { data, error } = await queryBuilder;

    if (error || !data) return [];

    return data.map((row: any) => ({
      datasetId: row.dataset_id,
      chunkType: row.chunk_type,
      chunkText: row.chunk_text,
      similarity: 0.5, // Arbitrary score for text matches
      metadata: row.metadata
    }));
  } catch (e) {
    return [];
  }
};

// ============================================================================
// KNOWLEDGE INDEXING
// ============================================================================

/**
 * Index a dataset's knowledge for semantic search
 * Call this when knowledge is updated
 */
export const indexDatasetKnowledge = async (
  datasetId: string,
  knowledge: {
    businessContext?: string;
    stories?: { title: string; content: string; category: string }[];
    dataDictionary?: { columns: { name: string; description: string; businessMeaning?: string }[] };
    analysisHistory?: { question: string; answer: string }[];
  },
  userId?: string
): Promise<number> => {
  const chunks: KnowledgeChunk[] = [];

  // Add business context chunk
  if (knowledge.businessContext) {
    chunks.push({
      datasetId,
      userId,
      chunkType: 'context',
      chunkText: knowledge.businessContext,
      metadata: { source: 'business_context' }
    });
  }

  // Add story chunks
  if (knowledge.stories) {
    for (const story of knowledge.stories) {
      chunks.push({
        datasetId,
        userId,
        chunkType: 'story',
        chunkText: `${story.title}: ${story.content}`,
        metadata: { category: story.category, title: story.title }
      });
    }
  }

  // Add column definition chunks
  if (knowledge.dataDictionary?.columns) {
    for (const col of knowledge.dataDictionary.columns) {
      const text = `Column "${col.name}": ${col.description}${col.businessMeaning ? `. Business meaning: ${col.businessMeaning}` : ''}`;
      chunks.push({
        datasetId,
        userId,
        chunkType: 'column_def',
        chunkText: text,
        metadata: { columnName: col.name }
      });
    }
  }

  // Add analysis history chunks (last 10)
  if (knowledge.analysisHistory) {
    for (const insight of knowledge.analysisHistory.slice(-10)) {
      chunks.push({
        datasetId,
        userId,
        chunkType: 'insight',
        chunkText: `Q: ${insight.question}\nA: ${insight.answer}`,
        metadata: { type: 'qa' }
      });
    }
  }

  // Delete existing chunks and store new ones
  await deleteDatasetChunks(datasetId);
  return await storeKnowledgeChunks(chunks);
};

export default {
  generateEmbedding,
  generateEmbeddings,
  storeKnowledgeChunk,
  storeKnowledgeChunks,
  deleteDatasetChunks,
  searchKnowledge,
  searchAllKnowledge,
  indexDatasetKnowledge
};

