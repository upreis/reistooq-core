
-- Criar a permissão configuracoes:manage_roles que está faltando
INSERT INTO public.app_permissions (key, name, description)
VALUES ('configuracoes:manage_roles', 'Gerenciar Cargos e Permissões', 'Permite atribuir e remover cargos de usuários')
ON CONFLICT (key) DO NOTHING;

-- Atribuir essa permissão a cargos de administração
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT DISTINCT r.id, 'configuracoes:manage_roles'
FROM public.roles r
WHERE r.slug IN ('admin', 'owner', 'super_admin', 'administrador')
   OR EXISTS (
     SELECT 1 FROM public.role_permissions rp 
     WHERE rp.role_id = r.id 
     AND rp.permission_key = 'admin:access'
   )
ON CONFLICT (role_id, permission_key) DO NOTHING;
