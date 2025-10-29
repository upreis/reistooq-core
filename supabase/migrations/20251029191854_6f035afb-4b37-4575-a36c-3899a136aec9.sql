-- ============================================
-- FIX: RECURSÃO INFINITA - VERSÃO FINAL
-- ============================================

-- 1. Remover policies v2 também
DROP POLICY IF EXISTS "profiles_select_own_or_org_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_org_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_v2" ON public.profiles;
DROP POLICY IF EXISTS "integration_accounts_select_org_v2" ON public.integration_accounts;
DROP POLICY IF EXISTS "integration_accounts_mutate_org_v2" ON public.integration_accounts;

-- 2. Remover e recriar função
DROP FUNCTION IF EXISTS public.get_user_organization_id(uuid) CASCADE;

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

-- 3. Criar políticas finais para PROFILES (SEM RECURSÃO)
CREATE POLICY "profiles_read_final" 
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

CREATE POLICY "profiles_create_final" 
ON public.profiles
FOR INSERT
TO public
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_modify_final" 
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

CREATE POLICY "profiles_service_final"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Criar políticas finais para INTEGRATION_ACCOUNTS
CREATE POLICY "integration_read_final" 
ON public.integration_accounts
FOR SELECT
TO public
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "integration_write_final" 
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