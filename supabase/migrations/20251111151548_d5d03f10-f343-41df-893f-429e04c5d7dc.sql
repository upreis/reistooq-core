
-- ✅ FASE 2: LIMPEZA DE REGISTROS ÓRFÃOS SEM claim_id
-- 
-- JUSTIFICATIVA:
-- - 22 registros: Dados corrompidos do sistema antigo (integration_account_id NULL, JSONBs vazios)
-- - 28 registros: Cancelamentos (type='cancellation') que não pertencem à tabela de devoluções
-- - TODOS não têm claim_id (campo obrigatório para devoluções válidas)
-- - Nenhum order_id órfão existe em registros válidos (0 duplicatas)
-- - Sistema já sincronizou 1.519 devoluções válidas desde setembro/2025

-- Deletar registros sem claim_id (50 registros total)
DELETE FROM public.devolucoes_avancadas
WHERE claim_id IS NULL;

-- Verificar resultado
DO $$ 
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ LIMPEZA CONCLUÍDA: % registros órfãos deletados', deleted_count;
END $$;
