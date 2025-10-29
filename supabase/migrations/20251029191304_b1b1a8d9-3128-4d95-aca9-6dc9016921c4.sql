-- ============================================
-- FIX: RECURSÃO INFINITA EM PROFILES RLS
-- ============================================

-- 1. Remover função existente e recriar
DROP FUNCTION IF EXISTS public.get_user_organization_id(uuid);

CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organizacao_id 
  FROM public.profiles 
  WHERE id = _user_id
  LIMIT 1;
$$;

-- 2. Remover políticas duplicadas e com recursão em profiles
DROP POLICY IF EXISTS "profiles_org_isolation" ON public.profiles;
DROP POLICY IF EXISTS "profiles_org_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_restricted" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_only" ON public.profiles;

-- 3. Criar políticas corretas SEM recursão
CREATE POLICY "profiles_select_own_or_same_org" 
ON public.profiles
FOR SELECT
TO public
USING (
  id = auth.uid() 
  OR (
    organizacao_id = public.get_user_organization_id(auth.uid())
    AND has_permission('users:read')
  )
);

CREATE POLICY "profiles_insert_own" 
ON public.profiles
FOR INSERT
TO public
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own_or_same_org" 
ON public.profiles
FOR UPDATE
TO public
USING (
  id = auth.uid()
  OR (
    organizacao_id = public.get_user_organization_id(auth.uid())
    AND has_permission('users:update')
  )
)
WITH CHECK (
  id = auth.uid()
  OR (
    organizacao_id = public.get_user_organization_id(auth.uid())
    AND has_permission('users:update')
  )
);

-- 4. Remover políticas duplicadas de reclamacoes
DROP POLICY IF EXISTS "reclamacoes_org_isolation" ON public.reclamacoes;
DROP POLICY IF EXISTS "Users can insert reclamacoes to their organization" ON public.reclamacoes;
DROP POLICY IF EXISTS "Users can update reclamacoes in their organization" ON public.reclamacoes;

-- 5. Atualizar políticas de integration_accounts para usar a função
DROP POLICY IF EXISTS "integration_accounts: select by org" ON public.integration_accounts;
DROP POLICY IF EXISTS "integration_accounts: mutate by org with integrations:manage" ON public.integration_accounts;
DROP POLICY IF EXISTS "integration_accounts_org_isolation" ON public.integration_accounts;

CREATE POLICY "integration_accounts_select" 
ON public.integration_accounts
FOR SELECT
TO public
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "integration_accounts_mutate" 
ON public.integration_accounts
FOR ALL
TO public
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND has_permission('integrations:manage')
)
WITH CHECK (
  organization_id = public.get_user_organization_id(auth.uid())
  AND has_permission('integrations:manage')
);