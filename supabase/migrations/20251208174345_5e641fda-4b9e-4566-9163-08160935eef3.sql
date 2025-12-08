-- =====================================================
-- SECURITY FIX PART 2: Add organization_id to OMS tables
-- and create proper RLS policies
-- =====================================================

-- ===========================================
-- 1. ADD organization_id TO OMS TABLES
-- ===========================================

-- Add organization_id to oms_customers
ALTER TABLE public.oms_customers 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizacoes(id);

-- Add organization_id to oms_orders
ALTER TABLE public.oms_orders 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizacoes(id);

-- Add organization_id to oms_sales_reps
ALTER TABLE public.oms_sales_reps 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizacoes(id);

-- ===========================================
-- 2. CREATE PROPER RLS POLICIES FOR OMS TABLES
-- ===========================================

-- OMS_CUSTOMERS policies
DROP POLICY IF EXISTS "Usuários podem ver todos os clientes" ON public.oms_customers;
DROP POLICY IF EXISTS "Usuários podem atualizar clientes" ON public.oms_customers;
DROP POLICY IF EXISTS "oms_customers_authenticated_access" ON public.oms_customers;

CREATE POLICY "oms_customers_org_isolation" ON public.oms_customers
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- OMS_ORDERS policies
DROP POLICY IF EXISTS "oms_orders_authenticated_access" ON public.oms_orders;

CREATE POLICY "oms_orders_org_isolation" ON public.oms_orders
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- OMS_ORDER_ITEMS policies (via oms_orders join)
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar order items" ON public.oms_order_items;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar order items" ON public.oms_order_items;
DROP POLICY IF EXISTS "oms_order_items_authenticated_access" ON public.oms_order_items;

CREATE POLICY "oms_order_items_org_isolation" ON public.oms_order_items
FOR ALL USING (
  order_id IN (
    SELECT id FROM oms_orders WHERE organization_id = get_current_org_id()
  )
)
WITH CHECK (
  order_id IN (
    SELECT id FROM oms_orders WHERE organization_id = get_current_org_id()
  )
);

-- OMS_SALES_REPS policies
DROP POLICY IF EXISTS "Usuários podem ver todos os representantes" ON public.oms_sales_reps;
DROP POLICY IF EXISTS "oms_sales_reps_authenticated_access" ON public.oms_sales_reps;

CREATE POLICY "oms_sales_reps_org_isolation" ON public.oms_sales_reps
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- ===========================================
-- 3. CREATE INDEXES for performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_oms_customers_org ON public.oms_customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_oms_orders_org ON public.oms_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_oms_sales_reps_org ON public.oms_sales_reps(organization_id);

-- ===========================================
-- 4. CREATE HELPER FUNCTION for Edge Function verification
-- ===========================================
CREATE OR REPLACE FUNCTION public.verify_integration_account_ownership(
  p_user_id uuid,
  p_integration_account_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN integration_accounts ia ON ia.organization_id = p.organizacao_id
    WHERE p.id = p_user_id 
    AND ia.id = p_integration_account_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.verify_integration_account_ownership(uuid, uuid) TO authenticated;