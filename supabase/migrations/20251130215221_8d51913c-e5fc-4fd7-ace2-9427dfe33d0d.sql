-- =====================================================
-- CORREÇÃO: RLS POLICIES MAIS SEGURAS PARA ML_ORDERS
-- Fix de segurança: validar organization_id em INSERT/UPDATE
-- =====================================================

-- Remover policies permissivas antigas
DROP POLICY IF EXISTS ml_orders_insert_system ON public.ml_orders;
DROP POLICY IF EXISTS ml_orders_update_system ON public.ml_orders;

-- ✅ Policy INSERT: Validar que organization_id corresponde
CREATE POLICY ml_orders_insert_validated 
ON public.ml_orders 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_org_id() 
  OR current_setting('role', true) = 'service_role'
);

-- ✅ Policy UPDATE: Validar que organization_id corresponde
CREATE POLICY ml_orders_update_validated 
ON public.ml_orders 
FOR UPDATE 
USING (
  organization_id = get_current_org_id()
  OR current_setting('role', true) = 'service_role'
)
WITH CHECK (
  organization_id = get_current_org_id()
  OR current_setting('role', true) = 'service_role'
);

-- Comentário explicativo
COMMENT ON POLICY ml_orders_insert_validated ON public.ml_orders IS 
'Permite INSERT apenas se organization_id corresponde ao usuário autenticado ou via service_role';

COMMENT ON POLICY ml_orders_update_validated ON public.ml_orders IS 
'Permite UPDATE apenas se organization_id corresponde ao usuário autenticado ou via service_role';