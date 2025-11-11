-- ✅ FASE 4: REMOVER CONSTRAINTS CONFLITANTES
-- 
-- JUSTIFICATIVA ARQUITETURAL:
-- - Um pedido (order_id) pode ter MÚLTIPLOS claims (devoluções)
-- - Constraints antigas UNIQUE em order_id impedem isso
-- - claim_id é a ÚNICA chave necessária (1:1 com devolução ML)
-- - Constraints antigas causam "duplicate key value" em cenários válidos

-- 1. Remover constraint UNIQUE em order_id
ALTER TABLE public.devolucoes_avancadas 
DROP CONSTRAINT IF EXISTS devolucoes_avancadas_order_id_key;

-- 2. Remover constraint UNIQUE composta (order_id, integration_account_id)
ALTER TABLE public.devolucoes_avancadas 
DROP CONSTRAINT IF EXISTS devolucoes_avancadas_order_integration_key;

-- Verificar remoção
DO $$ 
BEGIN
  RAISE NOTICE '✅ CONSTRAINTS CONFLITANTES REMOVIDAS';
  RAISE NOTICE '   - devolucoes_avancadas_order_id_key (removida)';
  RAISE NOTICE '   - devolucoes_avancadas_order_integration_key (removida)';
  RAISE NOTICE '✅ ÚNICA CONSTRAINT ATIVA: devolucoes_avancadas_claim_id_key';
END $$;