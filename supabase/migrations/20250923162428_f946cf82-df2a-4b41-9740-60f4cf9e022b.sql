-- 🔒 CORREÇÃO CRÍTICA DE SEGURANÇA: Implementar RLS em todas as tabelas expostas

-- Habilitar RLS nas tabelas críticas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes (apenas organização)
CREATE POLICY "Clientes visíveis por organização" ON public.clientes
  FOR ALL USING (organization_id = (
    SELECT organizacao_id FROM public.profiles 
    WHERE id = auth.uid()
  ));

-- Políticas para histórico de vendas (apenas organização)
CREATE POLICY "Vendas visíveis por organização" ON public.historico_vendas
  FOR ALL USING (organization_id = (
    SELECT organizacao_id FROM public.profiles 
    WHERE id = auth.uid()
  ));

-- Políticas para pedidos (apenas organização)
CREATE POLICY "Pedidos visíveis por organização" ON public.pedidos
  FOR ALL USING (organization_id = (
    SELECT organizacao_id FROM public.profiles 
    WHERE id = auth.uid()
  ));

-- Políticas para contas de integração (apenas organização)
CREATE POLICY "Integração visível por organização" ON public.integration_accounts
  FOR ALL USING (organization_id = (
    SELECT organizacao_id FROM public.profiles 
    WHERE id = auth.uid()
  ));

-- Políticas para pedidos de compra (apenas organização)
CREATE POLICY "Pedidos compra visíveis por organização" ON public.pedidos_compra
  FOR ALL USING (organization_id = (
    SELECT organizacao_id FROM public.profiles 
    WHERE id = auth.uid()
  ));

-- Políticas para cotações (apenas organização)
CREATE POLICY "Cotações visíveis por organização" ON public.cotacoes
  FOR ALL USING (organization_id = (
    SELECT organizacao_id FROM public.profiles 
    WHERE id = auth.uid()
  ));

-- Políticas para fornecedores (apenas organização)
CREATE POLICY "Fornecedores visíveis por organização" ON public.fornecedores
  FOR ALL USING (organization_id = (
    SELECT organizacao_id FROM public.profiles 
    WHERE id = auth.uid()
  ));

-- Corrigir search_path das funções (FIX de segurança adicional)
ALTER FUNCTION public.get_profile_safe SET search_path = public;
ALTER FUNCTION public.get_user_permissions SET search_path = public;
ALTER FUNCTION public.get_historico_vendas_masked SET search_path = public;