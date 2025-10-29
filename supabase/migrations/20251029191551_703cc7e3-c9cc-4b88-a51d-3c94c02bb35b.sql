-- ============================================
-- FIX: RECURSÃO INFINITA EM PROFILES RLS (COMPLETO)
-- ============================================

-- 1. Remover TODAS as políticas antigas (incluindo as que já existem)
DROP POLICY IF EXISTS "profiles_org_isolation" ON public.profiles;
DROP POLICY IF EXISTS "profiles_org_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_restricted" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_same_org" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_same_org" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Service role can access all profiles" ON public.profiles;

-- Integration accounts
DROP POLICY IF EXISTS "integration_accounts: select by org" ON public.integration_accounts;
DROP POLICY IF EXISTS "integration_accounts: mutate by org with integrations:manage" ON public.integration_accounts;
DROP POLICY IF EXISTS "integration_accounts_org_isolation" ON public.integration_accounts;
DROP POLICY IF EXISTS "integration_accounts_select" ON public.integration_accounts;
DROP POLICY IF EXISTS "integration_accounts_mutate" ON public.integration_accounts;
DROP POLICY IF EXISTS "Integração por organização via auth" ON public.integration_accounts;

-- Reclamacoes duplicadas
DROP POLICY IF EXISTS "reclamacoes_org_isolation" ON public.reclamacoes;
DROP POLICY IF EXISTS "Users can insert reclamacoes to their organization" ON public.reclamacoes;
DROP POLICY IF EXISTS "Users can update reclamacoes in their organization" ON public.reclamacoes;

-- 2. Remover e recriar a função security definer
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

-- 3. Recriar políticas LIMPAS para PROFILES
CREATE POLICY "profiles_select_own_or_org" 
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

CREATE POLICY "profiles_insert_self" 
ON public.profiles
FOR INSERT
TO public
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_self_or_org" 
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

-- Service role bypass
CREATE POLICY "profiles_service_role_access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Recriar políticas para INTEGRATION_ACCOUNTS
CREATE POLICY "integration_accounts_select_by_org" 
ON public.integration_accounts
FOR SELECT
TO public
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "integration_accounts_mutate_by_org" 
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