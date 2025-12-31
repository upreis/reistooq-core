-- ================================================
-- CORREÇÃO 1: Tabela CLIENTES
-- Remove policies inseguras que permitem acesso a qualquer usuário autenticado
-- A policy clientes_org_isolation (correta) já existe e será mantida
-- ================================================

-- Remover policy insegura: permite qualquer usuário autenticado
DROP POLICY IF EXISTS "Clientes por organização via auth" ON public.clientes;

-- Remover policy insegura duplicada
DROP POLICY IF EXISTS "clientes_authenticated_access" ON public.clientes;

-- VERIFICAÇÃO: A policy clientes_org_isolation continua ativa
-- Ela garante que usuários só vejam clientes da própria organização
COMMENT ON TABLE public.clientes IS 'SECURITY: Acesso restrito por organization_id via RLS policy clientes_org_isolation';