
-- ================================================
-- CORREÇÃO OMS: Remove policies inseguras (auth.uid() IS NOT NULL)
-- As policies seguras (*_org_isolation, admin_access, sales_rep_access) continuam ativas
-- ================================================

-- oms_orders: remove 4 inseguras, mantém 3 seguras (org_isolation, admin_access, sales_rep_access)
DROP POLICY IF EXISTS "Usuários podem ver todos os pedidos" ON public.oms_orders;
DROP POLICY IF EXISTS "Usuários podem criar pedidos" ON public.oms_orders;
DROP POLICY IF EXISTS "Usuários podem atualizar pedidos" ON public.oms_orders;
DROP POLICY IF EXISTS "Usuários podem deletar pedidos" ON public.oms_orders;

-- oms_order_items: remove 4 inseguras, mantém 1 segura (org_isolation)
DROP POLICY IF EXISTS "Usuários podem ver itens dos pedidos" ON public.oms_order_items;
DROP POLICY IF EXISTS "Usuários podem criar itens dos pedidos" ON public.oms_order_items;
DROP POLICY IF EXISTS "Usuários podem atualizar itens dos pedidos" ON public.oms_order_items;
DROP POLICY IF EXISTS "Usuários podem deletar itens dos pedidos" ON public.oms_order_items;

-- oms_sales_reps: remove 3 inseguras, mantém 1 segura (org_isolation)
DROP POLICY IF EXISTS "Usuários podem ver representantes" ON public.oms_sales_reps;
DROP POLICY IF EXISTS "Usuários podem criar representantes" ON public.oms_sales_reps;
DROP POLICY IF EXISTS "Usuários podem atualizar representantes" ON public.oms_sales_reps;

-- Adicionar comentários de segurança
COMMENT ON TABLE public.oms_orders IS 'SECURITY: Acesso via oms_orders_org_isolation, oms_orders_admin_access e oms_orders_sales_rep_access';
COMMENT ON TABLE public.oms_order_items IS 'SECURITY: Acesso via oms_order_items_org_isolation (baseado em order_id)';
COMMENT ON TABLE public.oms_sales_reps IS 'SECURITY: Acesso via oms_sales_reps_org_isolation';
