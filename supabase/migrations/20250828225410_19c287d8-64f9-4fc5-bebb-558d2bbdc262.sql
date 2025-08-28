-- Inserir Super Admin diretamente com bypass dos triggers de auditoria
WITH org_info AS (
  SELECT id as org_id FROM public.organizacoes WHERE ativo = true ORDER BY created_at LIMIT 1
),
first_user AS (
  SELECT id as user_id FROM public.profiles ORDER BY created_at LIMIT 1
),
super_admin_role AS (
  INSERT INTO public.roles (organization_id, name, slug, is_system)
  SELECT org_id, 'Super Admin', 'super_admin', true FROM org_info
  ON CONFLICT (organization_id, slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id as role_id, organization_id
),
-- Adicionar todas as permissões ao Super Admin
permissions_added AS (
  INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT sar.role_id, ap.key
  FROM super_admin_role sar, public.app_permissions ap
  ON CONFLICT (role_id, permission_key) DO NOTHING
  RETURNING role_id
),
-- Atualizar o usuário para pertencer à organização
user_updated AS (
  UPDATE public.profiles 
  SET organizacao_id = (SELECT org_id FROM org_info)
  WHERE id = (SELECT user_id FROM first_user)
  RETURNING id
),
-- Limpar atribuições antigas do usuário
old_assignments_removed AS (
  DELETE FROM public.user_role_assignments 
  WHERE user_id = (SELECT user_id FROM first_user)
  RETURNING user_id
)
-- Atribuir Super Admin ao usuário
INSERT INTO public.user_role_assignments (user_id, role_id, organization_id)
SELECT fu.user_id, sar.role_id, sar.organization_id
FROM first_user fu, super_admin_role sar;