-- Migração para ml_devolucoes_reclamacoes com return_id e índices únicos condicionais

-- Adicionar coluna return_id se não existir
ALTER TABLE public.ml_devolucoes_reclamacoes 
ADD COLUMN IF NOT EXISTS return_id text;

-- Criar índices únicos condicionais para evitar duplicatas
-- Índice para claims (quando claim_id não é null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ml_devolucoes_claim_unique 
ON public.ml_devolucoes_reclamacoes (integration_account_id, claim_id) 
WHERE claim_id IS NOT NULL;

-- Índice para returns (quando return_id não é null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ml_devolucoes_return_unique 
ON public.ml_devolucoes_reclamacoes (integration_account_id, return_id) 
WHERE return_id IS NOT NULL;

-- Índice para orders canceladas (quando ambos claim_id e return_id são null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ml_devolucoes_order_unique 
ON public.ml_devolucoes_reclamacoes (integration_account_id, order_id) 
WHERE claim_id IS NULL AND return_id IS NULL;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.ml_devolucoes_reclamacoes.return_id IS 'ID do return do Mercado Livre quando mode=returns';
COMMENT ON INDEX idx_ml_devolucoes_claim_unique IS 'Evita duplicatas para claims';
COMMENT ON INDEX idx_ml_devolucoes_return_unique IS 'Evita duplicatas para returns';
COMMENT ON INDEX idx_ml_devolucoes_order_unique IS 'Evita duplicatas para orders canceladas';