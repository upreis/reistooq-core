-- Criar Super Admin de forma manual sem triggers de auditoria
WITH org_info AS (
  -- Garantir que existe uma organização
  SELECT COALESCE(
    (SELECT id FROM public.organizacoes WHERE ativo = true ORDER BY created_at LIMIT 1),
    (SELECT id FROM public.organizacoes ORDER BY created_at LIMIT 1)
  ) as org_id
), user_info AS (
  -- Buscar o primeiro usuário disponível
  SELECT COALESCE(
    (SELECT p.id FROM public.profiles p, org_info o WHERE p.organizacao_id = o.org_id ORDER BY p.created_at LIMIT 1),
    (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1)
  ) as user_id,
  (SELECT org_id FROM org_info) as org_id
), super_admin_role AS (
  -- Criar/atualizar o cargo Super Admin
  INSERT INTO public.roles (organization_id, name, slug, is_system)
  SELECT u.org_id, 'Super Admin', 'super_admin', true
  FROM user_info u
  WHERE u.org_id IS NOT NULL
  ON CONFLICT (organization_id, slug) 
  DO UPDATE SET name = EXCLUDED.name, updated_at = now()
  RETURNING id, organization_id
), clean_permissions AS (
  -- Limpar permissões antigas
  DELETE FROM public.role_permissions 
  WHERE role_id IN (SELECT id FROM super_admin_role)
  RETURNING 1 as cleaned
), add_permissions AS (
  -- Adicionar todas as permissões
  INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT sar.id, ap.key
  FROM super_admin_role sar
  CROSS JOIN public.app_permissions ap
  ON CONFLICT (role_id, permission_key) DO NOTHING
  RETURNING 1 as added
), clean_assignments AS (
  -- Limpar atribuições antigas do usuário
  DELETE FROM public.user_role_assignments 
  WHERE user_id IN (SELECT user_id FROM user_info WHERE user_id IS NOT NULL)
  RETURNING 1 as cleaned
), assign_role AS (
  -- Atribuir Super Admin ao usuário
  INSERT INTO public.user_role_assignments (user_id, role_id, organization_id)
  SELECT ui.user_id, sar.id, sar.organization_id
  FROM user_info ui, super_admin_role sar
  WHERE ui.user_id IS NOT NULL
  RETURNING 1 as assigned
)
-- Retornar informações sobre o que foi criado
SELECT 
  'Super Admin criado com sucesso!' as message,
  (SELECT org_id FROM org_info) as organization_id,
  (SELECT user_id FROM user_info) as user_id,
  (SELECT id FROM super_admin_role) as role_id,
  (SELECT COUNT(*) FROM add_permissions) as permissions_added;