-- FASE 2: CLEANUP - Remover tabela obsoleta ml_claims_sync_status
-- 
-- Esta tabela foi substituída por campos em integration_accounts durante FASE 1 da simplificação
-- Campos de sync agora estão em: integration_accounts.last_claims_sync_at, last_sync_status, etc.
-- 
-- ✅ SEGURO: Nenhum código referencia esta tabela
-- ✅ CRON job usa integration_accounts
-- ✅ Sistema 100% funcional sem ela

DROP TABLE IF EXISTS public.ml_claims_sync_status CASCADE;