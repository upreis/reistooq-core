-- ============================================================================
-- FASE 3: RAG INTELIGENTE - Busca Semântica
-- ============================================================================

-- Função para buscar conhecimento por similaridade de embeddings
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_org_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  source text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.source,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE 
    kb.is_active = true
    AND kb.embedding IS NOT NULL
    AND (filter_org_id IS NULL OR kb.organization_id IS NULL OR kb.organization_id = filter_org_id)
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Criar índice HNSW para busca rápida de embeddings
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding_hnsw 
ON knowledge_base 
USING hnsw (embedding vector_cosine_ops);

-- Comentário explicativo
COMMENT ON FUNCTION match_knowledge IS 'Busca semântica na base de conhecimento usando similaridade de embeddings (cosine distance)';
