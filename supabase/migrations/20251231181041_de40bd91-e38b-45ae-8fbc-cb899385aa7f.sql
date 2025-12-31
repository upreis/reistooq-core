-- ================================================
-- CORREÇÃO 2: Tabela HISTORICO_VENDAS
-- Remove policies inseguras que permitem acesso a qualquer usuário autenticado
-- A policy historico_vendas_org_isolation (correta) já existe e será mantida
-- ================================================

-- Remover policy insegura: permite qualquer usuário autenticado
DROP POLICY IF EXISTS "Histórico vendas por organização via auth" ON public.historico_vendas;

-- Remover policy insegura duplicada
DROP POLICY IF EXISTS "historico_vendas_authenticated_access" ON public.historico_vendas;

-- VERIFICAÇÃO: A policy historico_vendas_org_isolation continua ativa
-- Ela garante que usuários só vejam vendas das integration_accounts da própria organização
COMMENT ON TABLE public.historico_vendas IS 'SECURITY: Acesso restrito por integration_account_id via RLS policy historico_vendas_org_isolation';