-- Adicionar todas as permissões que estão faltando no sistema
INSERT INTO public.app_permissions (key, name, description) VALUES
  ('users:read', 'Visualizar Usuários', 'Permite visualizar lista de usuários'),
  ('roles:manage', 'Gerenciar Cargos', 'Permite criar, editar e gerenciar cargos'),
  ('invites:manage', 'Gerenciar Convites', 'Permite enviar e gerenciar convites'),
  ('system:audit', 'Auditoria do Sistema', 'Permite acessar logs de auditoria'),
  ('integrations:manage', 'Gerenciar Integrações', 'Permite gerenciar integrações do sistema'),
  ('alerts:view', 'Visualizar Alertas', 'Permite acessar sistema de alertas'),
  ('historico:view', 'Visualizar Histórico', 'Permite acessar histórico de vendas'),
  ('demo:access', 'Acessar Demo', 'Permite acessar páginas de demonstração'),
  ('oms:view', 'Visualizar OMS', 'Permite acessar sistema OMS')
ON CONFLICT (key) DO NOTHING;

-- Adicionar TODAS essas permissões ao role de Administrador da sua organização
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, ap.key
FROM public.roles r
CROSS JOIN public.app_permissions ap
WHERE r.organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768'
  AND r.name = 'Administrador'
  AND ap.key IN ('users:read', 'roles:manage', 'invites:manage', 'system:audit', 'integrations:manage', 'alerts:view', 'historico:view', 'demo:access', 'oms:view')
ON CONFLICT (role_id, permission_key) DO NOTHING;