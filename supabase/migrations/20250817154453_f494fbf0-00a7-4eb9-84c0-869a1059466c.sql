-- SECURITY FIX: Properly secure profiles_safe view
-- Since we can't enable RLS directly on views, we need to ensure proper access control

-- 1) Remove any existing public/anon access from the view
REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;

-- 2) Grant controlled access only to authenticated users
GRANT SELECT ON public.profiles_safe TO authenticated;

-- 3) Ensure the view uses security_invoker and security_barrier for proper security
ALTER VIEW public.profiles_safe 
  SET (security_invoker = true, security_barrier = true);

-- 4) Verify the underlying profiles table has RLS enabled and proper policies
-- (The profiles table already has RLS policies for self-access and service role access)

-- 5) Since we can't add RLS policies to the view directly, we need to ensure
-- the view definition itself only shows organization-appropriate data
-- Let's recreate the view with built-in organization filtering

DROP VIEW IF EXISTS public.profiles_safe;

CREATE VIEW public.profiles_safe
WITH (security_invoker = true, security_barrier = true)
AS SELECT 
  p.id,
  p.nome_completo,
  p.nome_exibicao,
  public.mask_phone(p.telefone) as telefone, -- Always mask phone numbers
  p.cargo,
  p.departamento,
  p.organizacao_id,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  p.onboarding_banner_dismissed,
  p.configuracoes_notificacao
FROM public.profiles p
WHERE (
  -- Only show profiles from current user's organization
  p.organizacao_id = public.get_current_org_id()
  -- OR user can see their own profile regardless of organization
  OR p.id = auth.uid()
);

-- 6) Set proper grants on the new view
REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;
GRANT SELECT ON public.profiles_safe TO authenticated;

-- 7) Ensure default privileges don't grant public access to future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  REVOKE ALL ON TABLES FROM PUBLIC, anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon;