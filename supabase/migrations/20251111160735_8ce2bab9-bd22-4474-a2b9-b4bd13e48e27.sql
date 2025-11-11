-- ============================================
-- FASE 5: CORREÇÃO DE DEFAULT INCONSISTENTE
-- ============================================
-- Corrigir default de dados_quantities para null (consistente com outras colunas JSONB)

-- Alterar default de dados_quantities de '{}' para NULL
ALTER TABLE public.devolucoes_avancadas 
  ALTER COLUMN dados_quantities SET DEFAULT NULL;

-- Atualizar registros existentes que têm {} para NULL (opcional, para consistência total)
UPDATE public.devolucoes_avancadas 
SET dados_quantities = NULL 
WHERE dados_quantities = '{}'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN public.devolucoes_avancadas.dados_quantities IS 
'Dados de quantidades (total_quantity, return_quantity, quantity_type). Default NULL para consistência com outras colunas JSONB.';