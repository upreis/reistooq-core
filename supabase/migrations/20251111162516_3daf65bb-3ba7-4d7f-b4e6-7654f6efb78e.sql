-- 🔥 FASE 6: Correção Erro 42P10 - Constraint em fila_processamento_claims
-- 
-- PROBLEMA: ml-api-direct tenta fazer upsert com onConflict em constraint inexistente
-- SOLUÇÃO: Criar constraint UNIQUE (claim_id, integration_account_id)

-- 1. Criar constraint única para permitir upsert (deletar se existir primeiro)
DO $$
BEGIN
  -- Tentar deletar constraint se existir
  ALTER TABLE fila_processamento_claims
  DROP CONSTRAINT IF EXISTS fila_processamento_claims_claim_integration_key;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Criar nova constraint
ALTER TABLE fila_processamento_claims
ADD CONSTRAINT fila_processamento_claims_claim_integration_key 
UNIQUE (claim_id, integration_account_id);

-- 2. Criar índice para performance (se não existir)
CREATE INDEX IF NOT EXISTS idx_fila_claim_integration 
ON fila_processamento_claims(claim_id, integration_account_id);

-- 3. Comentário para documentação
COMMENT ON CONSTRAINT fila_processamento_claims_claim_integration_key 
ON fila_processamento_claims 
IS 'Constraint única para permitir upsert em ml-api-direct sem erro 42P10. Previne duplicatas de claims na fila de processamento.';