-- COMBO 2 SIMPLIFICATION - FASE 2
-- Deletar tabela ml_claims_cache duplicada

-- ml_claims agora é o único cache (permanente)
-- React Query gerencia staleness (staleTime: 60s), não precisa TTL no banco

DROP TABLE IF EXISTS public.ml_claims_cache CASCADE;

-- Comentário explicando
COMMENT ON TABLE public.ml_claims IS 
'[COMBO 2 SIMPLIFICATION] Cache permanente de claims ML. React Query gerencia staleness (60s), eliminando necessidade de ml_claims_cache com TTL.';