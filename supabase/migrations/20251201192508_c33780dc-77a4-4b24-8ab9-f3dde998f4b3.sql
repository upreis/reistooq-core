-- COMBO 2 SIMPLIFICATION - FASE 1 (Conclusão - Ordem Corrigida)
-- Deletar tabela redundante ml_claims_sync_status

-- 1. Remover trigger primeiro
DROP TRIGGER IF EXISTS set_ml_sync_status_updated_at ON public.ml_sync_status;

-- 2. Remover função CASCADE para deletar dependências
DROP FUNCTION IF EXISTS public.update_ml_sync_status_updated_at() CASCADE;

-- 3. Deletar tabela ml_sync_status (nome correto da tabela antiga)
DROP TABLE IF EXISTS public.ml_sync_status CASCADE;

-- 4. Comentário explicando a simplificação
COMMENT ON COLUMN public.integration_accounts.last_claims_sync_at IS 
'[COMBO 2 SIMPLIFICATION] Consolidado de ml_claims_sync_status → Última sincronização de claims ML';