-- ================================================
-- CORREÇÃO 3: Tabela PEDIDOS
-- Remove policies inseguras + Cria policy baseada em integration_account_id
-- Mesmo padrão já funcionando em historico_vendas
-- ================================================

-- Remover policy insegura: permite qualquer usuário autenticado
DROP POLICY IF EXISTS "Pedidos por organização via auth" ON public.pedidos;

-- Remover policy insegura duplicada
DROP POLICY IF EXISTS "pedidos_authenticated_access" ON public.pedidos;

-- Criar policy segura baseada em integration_account_id
-- Usuários só veem pedidos das integration_accounts da própria organização
CREATE POLICY "pedidos_org_isolation" ON public.pedidos
FOR ALL
USING (
  integration_account_id IN (
    SELECT ia.id
    FROM integration_accounts ia
    JOIN profiles p ON p.organizacao_id = ia.organization_id
    WHERE p.id = auth.uid()
  )
)
WITH CHECK (
  integration_account_id IN (
    SELECT ia.id
    FROM integration_accounts ia
    JOIN profiles p ON p.organizacao_id = ia.organization_id
    WHERE p.id = auth.uid()
  )
);

COMMENT ON TABLE public.pedidos IS 'SECURITY: Acesso restrito por integration_account_id via RLS policy pedidos_org_isolation';