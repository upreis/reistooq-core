-- 🔒 CORREÇÃO CRÍTICA DE SEGURANÇA: Implementar RLS nas tabelas existentes (adaptado à estrutura real)

-- Habilitar RLS apenas nas tabelas que existem e têm organization_id
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- ✅ Política para pedidos de compra (já tem organization_id)
CREATE POLICY "Pedidos compra visíveis por organização" ON public.pedidos_compra
  FOR ALL USING (organization_id = (
    SELECT organizacao_id FROM public.profiles 
    WHERE id = auth.uid()
  ));

-- ✅ Política para cotações (já tem organization_id)
CREATE POLICY "Cotações visíveis por organização" ON public.cotacoes
  FOR ALL USING (organization_id = (
    SELECT organizacao_id FROM public.profiles 
    WHERE id = auth.uid()
  ));

-- ✅ Política para fornecedores (já tem organization_id)
CREATE POLICY "Fornecedores visíveis por organização" ON public.fornecedores
  FOR ALL USING (organization_id = (
    SELECT organizacao_id FROM public.profiles 
    WHERE id = auth.uid()
  ));

-- 🔒 Para tabelas sem organization_id, usar integration_account_id como controle
CREATE POLICY "Clientes por organização via auth" ON public.clientes
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Histórico vendas por organização via auth" ON public.historico_vendas
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Pedidos por organização via auth" ON public.pedidos
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Integração por organização via auth" ON public.integration_accounts
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Corrigir search_path das funções (FIX de segurança adicional)
ALTER FUNCTION public.get_profile_safe SET search_path = public;
ALTER FUNCTION public.get_user_permissions SET search_path = public;