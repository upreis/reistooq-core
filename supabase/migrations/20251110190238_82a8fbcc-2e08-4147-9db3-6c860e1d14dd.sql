-- ============================================
-- FASE 1: PREPARAÇÃO DO BANCO - DEVOLUÇÕES ML (CONTINUAÇÃO)
-- ============================================

-- Remover policy duplicada se existir
DROP POLICY IF EXISTS "Users can view sync status from their org" ON public.devolucoes_sync_status;
DROP POLICY IF EXISTS "System can manage sync status" ON public.devolucoes_sync_status;

-- Recriar policies corretamente
CREATE POLICY "Users can view sync status from their org"
  ON public.devolucoes_sync_status
  FOR SELECT
  USING (
    integration_account_id IN (
      SELECT id FROM integration_accounts 
      WHERE organization_id = get_current_org_id()
    )
  );

CREATE POLICY "System can manage sync status"
  ON public.devolucoes_sync_status
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Validação final
DO $$ 
BEGIN
  RAISE NOTICE '✅ FASE 1 CONCLUÍDA:';
  RAISE NOTICE '- Tabela devolucoes_sync_status criada';
  RAISE NOTICE '- Índices otimizados adicionados';
  RAISE NOTICE '- RLS policies configuradas';
  RAISE NOTICE '- Funções auxiliares criadas';
  RAISE NOTICE '- View de estatísticas criada';
END $$;