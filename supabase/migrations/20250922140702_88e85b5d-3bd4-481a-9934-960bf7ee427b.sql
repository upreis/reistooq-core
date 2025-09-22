-- ===================================================================
-- EMERGENCY FIX: Remove Blocking RLS Policies
-- ===================================================================

-- RESTORE CUSTOMER ACCESS
DROP POLICY IF EXISTS "clientes_no_direct_access" ON public.clientes;

CREATE POLICY "customers_organization_access" 
ON public.clientes 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND organization_id = get_current_org_id()
);

-- RESTORE SALES HISTORY ACCESS  
DROP POLICY IF EXISTS "historico_vendas_block_direct_access" ON public.historico_vendas;

CREATE POLICY "sales_history_organization_access"
ON public.historico_vendas
FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND organization_id = get_current_org_id()
);

-- RESTORE ORDERS ACCESS
DROP POLICY IF EXISTS "pedidos_deny_all_access" ON public.pedidos;

CREATE POLICY "orders_organization_access"
ON public.pedidos  
FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND organization_id = get_current_org_id()
);

-- FIX FUNCTION SECURITY PATHS
CREATE OR REPLACE FUNCTION public.check_clientes_secure_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT auth.uid() IS NOT NULL 
    AND get_current_org_id() IS NOT NULL
    AND has_permission('customers:read');
$$;