-- Phase 1: Fix UNIQUE constraint on pedidos_cancelados_ml
-- Remove old constraint and create new one with claim_id included

-- Drop old constraint
ALTER TABLE public.pedidos_cancelados_ml 
DROP CONSTRAINT IF EXISTS pedidos_cancelados_ml_order_id_integration_account_id_key;

-- Create new constraint with claim_id
ALTER TABLE public.pedidos_cancelados_ml 
ADD CONSTRAINT pedidos_cancelados_ml_order_id_claim_id_integration_account_id_key 
UNIQUE (order_id, claim_id, integration_account_id);

COMMENT ON CONSTRAINT pedidos_cancelados_ml_order_id_claim_id_integration_account_id_key 
ON public.pedidos_cancelados_ml 
IS 'Permite múltiplos claims por order_id, diferenciando por claim_id';