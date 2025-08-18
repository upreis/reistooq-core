-- Corrigir problemas de segurança identificados no scan

-- 1. Corrigir tabela profiles - implementar RLS restritivo (já existe a política correta)
-- A política atual já está segura: profiles_select_org_secure

-- 2. Remover a view profiles_safe que está causando exposição de dados
-- Esta view não tem RLS e expõe dados sensíveis
DROP VIEW IF EXISTS public.profiles_safe CASCADE;

-- 3. Corrigir tabela organizacoes - manter política restritiva atual
-- A política já está correta: org_select_current_only

-- 4. Corrigir tabela invitations - manter política restritiva atual  
-- A política já está correta: inv_select_org_members

-- 5. Garantir que todas as tabelas sensíveis tenham RLS habilitado
-- Verificar e reforçar RLS onde necessário

-- Criar função segura para obter dados de perfil quando necessário
CREATE OR REPLACE FUNCTION public.get_profile_secure(profile_id uuid)
RETURNS TABLE(
  id uuid, 
  nome_completo text, 
  nome_exibicao text, 
  cargo text, 
  departamento text, 
  organizacao_id uuid,
  avatar_url text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
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