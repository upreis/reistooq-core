-- 🔧 CORRIGIR CONSTRAINT DEVOLUCOES_SYNC_STATUS
-- Problema: constraint sem nome explícito causa erro no upsert
-- Solução: criar constraint com nome explícito

-- Remover constraint gerada automaticamente (se existir)
ALTER TABLE public.devolucoes_sync_status
DROP CONSTRAINT IF EXISTS devolucoes_sync_status_integration_account_id_sync_type_key;

-- Criar constraint com nome explícito
ALTER TABLE public.devolucoes_sync_status
ADD CONSTRAINT devolucoes_sync_status_account_sync_type_key 
UNIQUE (integration_account_id, sync_type);