-- Adicionar permissão system:ai_insights ao role de Administrador de todas organizações
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, 'system:ai_insights'
FROM roles r
WHERE r.slug = 'admin'
ON CONFLICT (role_id, permission_key) DO NOTHING;