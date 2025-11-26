-- =============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Dashboard -> SQL Editor -> New Query -> Paste -> Run
-- =============================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create dataset_knowledge table with vector embeddings
CREATE TABLE IF NOT EXISTS dataset_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL,
  dataset_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  
  -- Core metadata
  business_context TEXT,
  data_source TEXT,
  refresh_frequency TEXT,
  data_owner TEXT,
  domain TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Structured knowledge (JSONB for flexibility)
  data_dictionary JSONB DEFAULT '{}',
  stories JSONB DEFAULT '[]',
  relationships JSONB DEFAULT '[]',
  analysis_history JSONB DEFAULT '[]',
  known_issues TEXT[] DEFAULT '{}',
  data_quality_notes TEXT,
  
  -- Vector embeddings for semantic search (1536 dimensions for OpenAI ada-002)
  context_embedding vector(1536),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(dataset_id, user_id)
);

-- Create knowledge_chunks table for fine-grained semantic search
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  
  -- Chunk content
  chunk_type TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  -- Vector embedding
  embedding vector(1536),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Reference back to knowledge
  knowledge_id UUID REFERENCES dataset_knowledge(id) ON DELETE CASCADE
);

-- Indexes for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding 
  ON dataset_knowledge 
  USING ivfflat (context_embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_chunks_embedding 
  ON knowledge_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Standard indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_dataset_id ON dataset_knowledge(dataset_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_user_id ON dataset_knowledge(user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_dataset_id ON knowledge_chunks(dataset_id);
CREATE INDEX IF NOT EXISTS idx_chunks_type ON knowledge_chunks(chunk_type);

-- Enable RLS
ALTER TABLE dataset_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage own knowledge" ON dataset_knowledge;
CREATE POLICY "Users can manage own knowledge"
  ON dataset_knowledge FOR ALL TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can manage own chunks" ON knowledge_chunks;
CREATE POLICY "Users can manage own chunks"
  ON knowledge_chunks FOR ALL TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Function to search similar knowledge chunks
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_dataset_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  dataset_id uuid,
  chunk_type text,
  chunk_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.dataset_id,
    kc.chunk_type,
    kc.chunk_text,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE 
    (filter_dataset_id IS NULL OR kc.dataset_id = filter_dataset_id)
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search across all knowledge
CREATE OR REPLACE FUNCTION search_all_knowledge(
  query_embedding vector(1536),
  p_user_id uuid,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  dataset_id uuid,
  dataset_name text,
  chunk_type text,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.dataset_id,
    dk.dataset_name,
    kc.chunk_type,
    kc.chunk_text,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  JOIN dataset_knowledge dk ON dk.dataset_id = kc.dataset_id
  WHERE kc.user_id = p_user_id OR kc.user_id IS NULL
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================
-- SUCCESS! 
-- Tables: dataset_knowledge, knowledge_chunks
-- Functions: search_knowledge_chunks, search_all_knowledge
-- =============================================

