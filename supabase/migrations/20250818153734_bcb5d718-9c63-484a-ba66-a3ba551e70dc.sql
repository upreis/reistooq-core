-- Corrigir problemas de segurança identificados no scan

-- 1. Corrigir tabela profiles - remover acesso público e implementar RLS restritivo
DROP POLICY IF EXISTS "profiles_select_org_secure" ON public.profiles;

CREATE POLICY "profiles_select_org_secure" ON public.profiles
FOR SELECT USING (
  (id = auth.uid()) OR 
  ((organizacao_id = get_current_org_id()) AND has_permission('users:read'::text))
);

-- 2. Corrigir profiles_safe - implementar RLS adequada
ALTER TABLE public.profiles_safe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_safe_select_restricted" ON public.profiles_safe
FOR SELECT USING (
  (id = auth.uid()) OR 
  ((organizacao_id = get_current_org_id()) AND has_permission('users:read'::text))
);

-- 3. Corrigir tabela organizacoes - remover acesso público
DROP POLICY IF EXISTS "org_select_current_only" ON public.organizacoes;

CREATE POLICY "org_select_current_only" ON public.organizacoes
FOR SELECT USING (id = get_current_org_id());

-- 4. Corrigir tabela invitations - restringir acesso
DROP POLICY IF EXISTS "inv_select_org_members" ON public.invitations;

CREATE POLICY "inv_select_org_members" ON public.invitations  
FOR SELECT USING (
  (organization_id = get_current_org_id()) AND 
  has_permission('invites:read'::text)
);

-- 5. Remover view profiles_safe se não for necessária (é redundante e insegura)
-- Comentado para não quebrar código existente - avaliar se pode ser removida:
-- DROP VIEW IF EXISTS public.profiles_safe;