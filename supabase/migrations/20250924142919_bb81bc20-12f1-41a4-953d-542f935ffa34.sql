-- Recriar permissões para roles existentes usando permissões válidas
-- Primeiro, limpar permissões antigas se houver
DELETE FROM public.role_permissions 
WHERE role_id IN (
  SELECT id FROM public.roles 
  WHERE organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768'
);

-- Inserir TODAS as permissões para o cargo Administrador  
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, ap.key
FROM public.roles r
CROSS JOIN public.app_permissions ap
WHERE r.organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768'
  AND r.name = 'Administrador'
ON CONFLICT (role_id, permission_key) DO NOTHING;

-- Inserir permissões essenciais para o cargo Gerente de Integrações
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, perm.key
FROM public.roles r
CROSS JOIN (
  VALUES 
    ('dashboard:view'),
    ('pedidos:marketplace'),
    ('oms:pedidos'),
    ('oms:clientes'),
    ('estoque:view'),
    ('depara:view'),
    ('configuracoes:view')
) AS perm(key)
WHERE r.organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768'
  AND r.name = 'Gerente de Integrações'
ON CONFLICT (role_id, permission_key) DO NOTHING;