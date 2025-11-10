-- SPRINT 2: Função RPC para estatísticas de performance dos índices JSONB
-- Retorna métricas de uso, eficiência e tamanho dos índices criados

CREATE OR REPLACE FUNCTION public.get_jsonb_index_stats()
RETURNS TABLE(
  index_name text,
  table_name text,
  index_scans bigint,
  rows_read bigint,
  rows_fetched bigint,
  size_mb numeric,
  efficiency_score numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.indexrelname::text as index_name,
    s.relname::text as table_name,
    COALESCE(s.idx_scan, 0) as index_scans,
    COALESCE(s.idx_tup_read, 0) as rows_read,
    COALESCE(s.idx_tup_fetch, 0) as rows_fetched,
    ROUND(pg_relation_size(s.indexrelid) / 1024.0 / 1024.0, 2) as size_mb,
    CASE 
      WHEN s.idx_scan > 0 AND s.idx_tup_read > 0 THEN 
        ROUND((s.idx_tup_fetch::numeric / NULLIF(s.idx_tup_read, 0)::numeric) * 100, 1)
      WHEN s.idx_scan > 0 THEN 100.0
      ELSE 0.0
    END as efficiency_score
  FROM pg_stat_user_indexes s
  WHERE s.relname = 'devolucoes_avancadas'
    AND s.indexrelname LIKE 'idx_devolucoes_avancadas_%'
  ORDER BY s.idx_scan DESC NULLS LAST;
END;
$$;

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_jsonb_index_stats() TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION public.get_jsonb_index_stats() IS 
'Retorna estatísticas de performance dos índices JSONB da tabela devolucoes_avancadas. Usado pelo dashboard de performance (SPRINT 2).';
