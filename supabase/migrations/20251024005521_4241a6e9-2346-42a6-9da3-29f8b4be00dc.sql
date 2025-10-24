-- Phase 1: Verificar e limpar constraints duplicadas

-- Primeiro, vamos verificar quais constraints existem
DO $$
DECLARE
  old_constraint_exists BOOLEAN;
  new_constraint_exists BOOLEAN;
BEGIN
  -- Verificar constraint antiga
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pedidos_cancelados_ml_order_id_integration_account_id_key'
  ) INTO old_constraint_exists;
  
  -- Verificar constraint nova
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pedidos_cancelados_ml_order_id_claim_id_integration_account_id_'
  ) INTO new_constraint_exists;
  
  -- Se ambas existem, remover a antiga
  IF old_constraint_exists AND new_constraint_exists THEN
    RAISE NOTICE 'Removendo constraint antiga duplicada...';
    ALTER TABLE public.pedidos_cancelados_ml 
    DROP CONSTRAINT pedidos_cancelados_ml_order_id_integration_account_id_key;
  END IF;
  
  -- Se só a nova existe, está OK
  IF new_constraint_exists THEN
    RAISE NOTICE 'Constraint nova já existe - migration OK';
  END IF;
  
  -- Se só a antiga existe, criar a nova
  IF old_constraint_exists AND NOT new_constraint_exists THEN
    RAISE NOTICE 'Criando nova constraint...';
    ALTER TABLE public.pedidos_cancelados_ml 
    DROP CONSTRAINT pedidos_cancelados_ml_order_id_integration_account_id_key;
    
    ALTER TABLE public.pedidos_cancelados_ml 
    ADD CONSTRAINT pedidos_cancelados_ml_order_id_claim_id_integration_account_id_ 
    UNIQUE (order_id, claim_id, integration_account_id);
  END IF;
END $$;