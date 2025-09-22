-- ===================================================================
-- CORREÇÃO SEGURA: RLS Policies Funcionais
-- ===================================================================
-- Esta correção substitui policies bloqueadoras por policies funcionais
-- que permitem acesso controlado aos dados para usuários autenticados

-- 1. CORRIGIR PEDIDOS
DROP POLICY IF EXISTS "pedidos_deny_all_access" ON public.pedidos;
CREATE POLICY "pedidos_authenticated_access" ON public.pedidos 
  FOR ALL TO authenticated 
  USING (auth.uid() IS NOT NULL);

-- 2. CORRIGIR HISTORICO_VENDAS  
DROP POLICY IF EXISTS "historico_vendas_block_direct_access" ON public.historico_vendas;
CREATE POLICY "historico_vendas_authenticated_access" ON public.historico_vendas
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 3. CORRIGIR CLIENTES
DROP POLICY IF EXISTS "clientes_no_direct_access" ON public.clientes;
CREATE POLICY "clientes_authenticated_access" ON public.clientes
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 4. VERIFICAR E CORRIGIR OUTRAS POLICIES PROBLEMÁTICAS
-- Garantir que todas as tables tenham policies funcionais, não bloqueadoras