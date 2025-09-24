-- Adicionar permissões que estão faltando no sistema
INSERT INTO public.app_permissions (key, name, description) VALUES
  ('orders:read', 'Visualizar Pedidos', 'Permite visualizar e acessar a lista de pedidos'),
  ('settings:view', 'Visualizar Configurações', 'Permite acessar as configurações de administração')
ON CONFLICT (key) DO NOTHING;

-- Adicionar essas permissões ao role de Administrador da sua organização
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, perm.key
FROM public.roles r
CROSS JOIN (
  VALUES 
    ('orders:read'),
    ('settings:view')
) AS perm(key)
WHERE r.organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768'
  AND r.name = 'Administrador'
ON CONFLICT (role_id, permission_key) DO NOTHING;