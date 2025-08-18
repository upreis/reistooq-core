-- Limpeza e correção definitiva para tabela profiles
-- Remove qualquer view ou política residual que possa estar causando conflito

-- 1. Remove qualquer view profiles_safe residual
DROP VIEW IF EXISTS public.profiles_safe CASCADE;

-- 2. Limpa políticas antigas conflitantes na tabela profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin_org" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_org" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;
DROP POLICY IF EXISTS "Service role can access all profiles" ON public.profiles;

-- 3. Reaplica políticas RLS limpas e consistentes
CREATE POLICY "profiles_insert_self_only" 
ON public.profiles FOR INSERT 
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_select_org_secure" 
ON public.profiles FOR SELECT 
USING (
  (id = auth.uid()) OR 
  ((organizacao_id = get_current_org_id()) AND has_permission('users:read'::text))
);

CREATE POLICY "profiles_update_self_only" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- 4. Política específica para service role ter acesso total
CREATE POLICY "Service role can access all profiles" 
ON public.profiles FOR SELECT 
TO service_role
USING (true);

-- 5. Garante que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;