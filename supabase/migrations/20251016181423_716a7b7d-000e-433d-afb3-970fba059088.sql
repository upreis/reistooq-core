-- FASE 2: Adicionar colunas faltantes na tabela devolucoes_avancadas
-- Estas colunas são referenciadas pelo código mas não existem no schema

-- Coluna para status de rastreamento (estava causando PGRST204)
ALTER TABLE public.devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS status_rastreamento text;

-- Colunas da FASE 2 que precisam ser populadas
ALTER TABLE public.devolucoes_avancadas
ADD COLUMN IF NOT EXISTS reason_category text,
ADD COLUMN IF NOT EXISTS motivo_categoria text;

-- Comentários para documentação
COMMENT ON COLUMN public.devolucoes_avancadas.status_rastreamento IS 'Status do rastreamento do pedido/devolução';
COMMENT ON COLUMN public.devolucoes_avancadas.reason_category IS 'Categoria do motivo da devolução (derivado de reason_id)';
COMMENT ON COLUMN public.devolucoes_avancadas.motivo_categoria IS 'Categoria do motivo em português';