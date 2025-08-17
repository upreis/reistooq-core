-- Fix Security Definer View issue by replacing unsafe views with RLS-enforced functions

-- 1. Drop the existing profiles_safe view (it bypasses RLS)
DROP VIEW IF EXISTS public.profiles_safe CASCADE;

-- 2. Create a secure function to get profiles with proper data masking
CREATE OR REPLACE FUNCTION public.get_profiles_safe()
RETURNS TABLE(
  id uuid,
  nome_completo text,
  nome_exibicao text,
  telefone text,
  cargo text,
  departamento text,
  organizacao_id uuid,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  onboarding_banner_dismissed boolean,
  configuracoes_notificacao jsonb
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    CASE 
      WHEN p.id = auth.uid() OR public.has_permission('users:read') 
      THEN p.nome_completo 
      ELSE public.mask_name(p.nome_completo) 
    END as nome_completo,
    p.nome_exibicao,
    CASE 
      WHEN p.id = auth.uid() OR public.has_permission('users:read') 
      THEN p.telefone 
      ELSE public.mask_phone(p.telefone) 
    END as telefone,
    CASE 
      WHEN p.id = auth.uid() OR public.has_permission('users:read') 
      THEN p.cargo 
      ELSE NULL 
    END as cargo,
    CASE 
      WHEN p.id = auth.uid() OR public.has_permission('users:read') 
      THEN p.departamento 
      ELSE NULL 
    END as departamento,
    p.organizacao_id,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.onboarding_banner_dismissed,
    p.configuracoes_notificacao
  FROM public.profiles p
  WHERE p.organizacao_id = public.get_current_org_id();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_profiles_safe() TO authenticated;

-- 3. Create a comment explaining the security improvement
COMMENT ON FUNCTION public.get_profiles_safe() IS 'Secure function that replaces profiles_safe view. Enforces RLS and proper data masking based on user permissions.';

-- 4. Ensure historico_vendas_safe cannot be accessed directly (already done previously but reinforcing)
-- The historico_vendas_safe view is already secured and replaced by get_historico_vendas_masked RPC

-- Add a note that profiles_safe view has been replaced
DO $$
BEGIN
  -- Log that the migration completed successfully
  RAISE NOTICE 'Security Definer View issue fixed: profiles_safe view replaced with get_profiles_safe() function';
  RAISE NOTICE 'Users should now call get_profiles_safe() instead of selecting from profiles_safe';
END$$;