-- ============================================
-- FASE 1: PREPARAÇÃO DO BANCO - DEVOLUÇÕES ML (CONTINUAÇÃO)
-- ============================================

-- Remover policy duplicada se existir
DROP POLICY IF EXISTS "Users can view sync status from their org" ON public.devolucoes_sync_status;

-- Recriar a policy corretamente
CREATE POLICY "Users can view sync status from their org"
  ON public.devolucoes_sync_status
  FOR SELECT
  USING (
    integration_account_id IN (
      SELECT id FROM integration_accounts 
      WHERE organization_id = get_current_org_id()
    )
  );

COMMENT ON TABLE public.devolucoes_sync_status IS 'Controla o status de sincronização de devoluções para cada conta de integração';
COMMENT ON COLUMN public.devolucoes_sync_status.sync_type IS 'Tipo de sincronização: full (completa), incremental (últimos N dias), enrichment (enriquecimento)';
COMMENT ON COLUMN public.devolucoes_sync_status.last_sync_status IS 'Status da última sincronização: success, error, in_progress, pending';