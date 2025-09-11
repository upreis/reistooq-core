-- Final Security Hardening: Fix remaining search_path issues
-- This addresses all remaining "Function Search Path Mutable" warnings

-- Update all remaining functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT organizacao_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_permission(permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT permission_key = ANY(public.get_user_permissions());
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions()
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
WITH org AS (
  SELECT public.get_current_org_id() AS org_id
),
role_perms AS (
  SELECT rp.permission_key
  FROM public.user_role_assignments ura
  JOIN public.roles r ON r.id = ura.role_id
  JOIN public.role_permissions rp ON rp.role_id = r.id
  CROSS JOIN org
  WHERE ura.user_id = auth.uid()
    AND r.organization_id = org.org_id
),
allows AS (
  SELECT permission_key FROM public.user_permission_overrides, org
  WHERE user_id = auth.uid() AND organization_id = org.org_id AND allow = true
),
disallows AS (
  SELECT permission_key FROM public.user_permission_overrides, org
  WHERE user_id = auth.uid() AND organization_id = org.org_id AND allow = false
)
SELECT COALESCE(
  ARRAY(
    SELECT DISTINCT p FROM (
      SELECT permission_key AS p FROM role_perms
      UNION ALL
      SELECT permission_key FROM allows
    ) s
    EXCEPT
    SELECT permission_key FROM disallows
    ORDER BY 1
  ),
  ARRAY[]::text[]
);
$$;

CREATE OR REPLACE FUNCTION public.user_matches_announcement(target_users uuid[], target_roles uuid[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    CASE 
      WHEN target_users IS NOT NULL AND auth.uid() = ANY(target_users) THEN true
      WHEN target_roles IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_role_assignments ura 
        WHERE ura.user_id = auth.uid() 
        AND ura.role_id = ANY(target_roles)
      ) THEN true
      WHEN target_users IS NULL AND target_roles IS NULL THEN true
      ELSE false
    END
$$;

CREATE OR REPLACE FUNCTION public.get_profile_secure(profile_id uuid)
RETURNS TABLE(id uuid, nome_completo text, nome_exibicao text, cargo text, departamento text, organizacao_id uuid, avatar_url text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    p.id,
    CASE 
      WHEN p.id = auth.uid() OR public.has_permission('users:read') 
      THEN p.nome_completo 
      ELSE public.mask_name(p.nome_completo) 
    END,
    p.nome_exibicao,
    CASE 
      WHEN p.id = auth.uid() OR public.has_permission('users:read') 
      THEN p.cargo 
      ELSE NULL 
    END,
    CASE 
      WHEN p.id = auth.uid() OR public.has_permission('users:read') 
      THEN p.departamento 
      ELSE NULL 
    END,
    p.organizacao_id,
    p.avatar_url,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_id
    AND p.organizacao_id = public.get_current_org_id();
$$;

CREATE OR REPLACE FUNCTION public.get_profiles_safe()
RETURNS TABLE(id uuid, nome_completo text, nome_exibicao text, telefone text, cargo text, departamento text, organizacao_id uuid, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone, onboarding_banner_dismissed boolean, configuracoes_notificacao jsonb)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    p.id,
    p.nome_completo,
    p.nome_exibicao,
    public.mask_phone(p.telefone) as telefone,
    p.cargo,
    p.departamento,
    p.organizacao_id,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.onboarding_banner_dismissed,
    p.configuracoes_notificacao
  FROM public.profiles p
  WHERE p.organizacao_id = public.get_current_org_id();
$$;

CREATE OR REPLACE FUNCTION public.get_low_stock_products_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.produtos
  WHERE ativo = true
    AND quantidade_atual <= estoque_minimo
    AND organization_id = public.get_current_org_id();
$$;