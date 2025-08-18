-- Inserir permissões faltantes para vendas se não existirem
INSERT INTO app_permissions (key, name, description) 
VALUES ('vendas:read', 'Ler vendas', 'Permite visualizar histórico de vendas da organização')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_permissions (key, name, description) 
VALUES ('vendas:view_pii', 'Ver dados pessoais de vendas', 'Permite visualizar dados pessoais mascarados nas vendas')
ON CONFLICT (key) DO NOTHING;

-- Verificar se a permissão orders:read já existe, se não criar
INSERT INTO app_permissions (key, name, description) 
VALUES ('orders:read', 'Ler pedidos', 'Permite visualizar pedidos da organização')
ON CONFLICT (key) DO NOTHING;