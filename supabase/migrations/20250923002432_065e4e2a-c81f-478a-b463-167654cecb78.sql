-- Inserir a nova permissão compras:view no sistema
INSERT INTO public.app_permissions (key, name, description) VALUES
('compras:view', 'Visualizar Sistema de Compras', 'Permite acesso ao sistema de compras, fornecedores, pedidos e cotações')
ON CONFLICT (key) DO NOTHING;

-- Buscar role de administrador para adicionar a permissão
DO $$
DECLARE
    admin_role_id uuid;
    current_org_id uuid;
BEGIN
    -- Obter a organização atual (usando o campo correto)
    SELECT organizacao_id INTO current_org_id 
    FROM profiles 
    WHERE id = auth.uid() 
    LIMIT 1;
    
    IF current_org_id IS NOT NULL THEN
        -- Buscar role admin da organização
        SELECT id INTO admin_role_id 
        FROM roles 
        WHERE organization_id = current_org_id 
        AND slug = 'admin' 
        LIMIT 1;
        
        IF admin_role_id IS NOT NULL THEN
            -- Adicionar a permissão ao role admin
            INSERT INTO role_permissions (role_id, permission_key) 
            VALUES (admin_role_id, 'compras:view')
            ON CONFLICT (role_id, permission_key) DO NOTHING;
        END IF;
    END IF;
END $$;