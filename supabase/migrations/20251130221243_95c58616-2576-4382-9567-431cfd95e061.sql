
-- 🔧 CORREÇÃO #1: Adicionar coluna order_date à tabela ml_orders
ALTER TABLE ml_orders 
ADD COLUMN IF NOT EXISTS order_date TIMESTAMP WITH TIME ZONE;

-- Criar index para performance em filtros de data
CREATE INDEX IF NOT EXISTS idx_ml_orders_order_date 
ON ml_orders (organization_id, order_date DESC);

-- Migrar dados existentes: popular order_date com date_created
UPDATE ml_orders 
SET order_date = date_created 
WHERE order_date IS NULL AND date_created IS NOT NULL;

-- 🔧 CORREÇÃO #3: Corrigir RLS policy service_role
DROP POLICY IF EXISTS "ml_orders_insert_validated" ON ml_orders;

CREATE POLICY "ml_orders_insert_validated"
ON ml_orders FOR INSERT
WITH CHECK (
  organization_id = get_current_org_id() 
  OR auth.uid() IS NULL  -- Service role não tem uid
);
