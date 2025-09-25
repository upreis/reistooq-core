-- Políticas RLS seguras para isolamento de vendedores
-- Sem criar tabelas adicionais, usando sistema existente

-- Função auxiliar para verificar se usuário é sales rep
CREATE OR REPLACE FUNCTION public.get_current_sales_rep_id()
RETURNS UUID AS $$
  SELECT sr.id 
  FROM public.oms_sales_reps sr
  INNER JOIN auth.users u ON u.email = sr.email
  WHERE u.id = auth.uid() AND sr.is_active = true
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Aplicar RLS apenas na tabela oms_orders para isolamento
ALTER TABLE public.oms_orders ENABLE ROW LEVEL SECURITY;

-- Política: Admin pode ver todos os pedidos
CREATE POLICY "oms_orders_admin_access" ON public.oms_orders
FOR ALL USING (has_permission('oms:pedidos'));

-- Política: Vendedor só vê seus próprios pedidos  
CREATE POLICY "oms_orders_sales_rep_access" ON public.oms_orders
FOR ALL USING (
  sales_rep_id = public.get_current_sales_rep_id()
);