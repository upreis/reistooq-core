
-- Criar a permissão system:announce que está faltando
INSERT INTO public.app_permissions (key, name, description)
VALUES ('system:announce', 'Gerenciar Anúncios', 'Permite criar, editar e excluir anúncios do sistema')
ON CONFLICT (key) DO NOTHING;

-- Atribuir essa permissão a cargos de administração
-- Primeiro, vamos ver quais cargos têm permissões de admin e dar system:announce a eles
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT DISTINCT r.id, 'system:announce'
FROM public.roles r
WHERE r.slug IN ('admin', 'owner', 'super_admin', 'administrador')
   OR EXISTS (
     SELECT 1 FROM public.role_permissions rp 
     WHERE rp.role_id = r.id 
     AND rp.permission_key = 'admin:access'
   )
ON CONFLICT (role_id, permission_key) DO NOTHING;
