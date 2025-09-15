-- Adicionar suporte para returns do ML na tabela de devoluções
ALTER TABLE public.ml_devolucoes_reclamacoes 
ADD COLUMN IF NOT EXISTS return_id TEXT;

-- Atualizar constraint única para incluir return_id
ALTER TABLE public.ml_devolucoes_reclamacoes 
DROP CONSTRAINT IF EXISTS ml_devolucoes_reclamacoes_claim_id_integration_account_id_key;

-- Nova constraint que permite tanto claim_id quanto return_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_ml_devolucoes_unique_claim 
ON public.ml_devolucoes_reclamacoes(claim_id, integration_account_id) 
WHERE claim_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ml_devolucoes_unique_return 
ON public.ml_devolucoes_reclamacoes(return_id, integration_account_id) 
WHERE return_id IS NOT NULL;

-- Índice para return_id
CREATE INDEX IF NOT EXISTS idx_ml_devolucoes_return_id 
ON public.ml_devolucoes_reclamacoes(return_id);