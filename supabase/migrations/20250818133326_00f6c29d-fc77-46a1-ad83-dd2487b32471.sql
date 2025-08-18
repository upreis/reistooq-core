-- CORREÇÃO FINAL: Remover SECURITY DEFINER da view para conformidade
-- Recriar view profiles_safe sem SECURITY DEFINER

DROP VIEW IF EXISTS public.profiles_safe;

-- Recriar view sem SECURITY DEFINER (por conformidade de segurança)
CREATE VIEW public.profiles_safe AS
SELECT 
  p.id,
  p.nome_completo,
  p.nome_exibicao,
  CASE 
    WHEN p.id = auth.uid() THEN p.telefone
    ELSE public.mask_phone_secure(p.telefone)
  END AS telefone,
  p.cargo,
  p.departamento,
  p.organizacao_id,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  p.onboarding_banner_dismissed,
  p.configuracoes_notificacao
FROM public.profiles p
WHERE p.organizacao_id = get_current_org_id();

-- Habilitar RLS na view
ALTER VIEW public.profiles_safe SET (security_barrier = true);

-- Garantir permissões adequadas
GRANT SELECT ON public.profiles_safe TO authenticated;

-- Comentário final
COMMENT ON VIEW public.profiles_safe IS 'VIEW SEGURA: Profiles com mascaramento automático de telefones. RLS através da função get_current_org_id().';