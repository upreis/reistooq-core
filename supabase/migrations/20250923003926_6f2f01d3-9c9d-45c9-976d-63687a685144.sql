-- Adicionar permissão compras:view diretamente para o usuário nildoreiz@hotmail.com
INSERT INTO app_permissions (key, name, description) 
VALUES ('compras:view', 'Visualizar Sistema de Compras', 'Permite acesso ao módulo de compras')
ON CONFLICT (key) DO NOTHING;

-- Garantir que a permissão existe na tabela de permissões do app
DO $$
DECLARE
    user_uuid uuid;
    admin_role_uuid uuid;
    org_uuid uuid;
BEGIN
    -- Buscar o usuário pelo email
    SELECT id INTO user_uuid 
    FROM profiles 
    WHERE id IN (
        SELECT id FROM auth.users WHERE email = 'nildoreiz@hotmail.com'
    ) 
    LIMIT 1;
    
    IF user_uuid IS NOT NULL THEN
        -- Buscar a organização do usuário
        SELECT organizacao_id INTO org_uuid 
        FROM profiles 
        WHERE id = user_uuid;
        
        IF org_uuid IS NOT NULL THEN
            -- Buscar o role admin
            SELECT id INTO admin_role_uuid 
            FROM roles 
            WHERE organization_id = org_uuid 
            AND slug = 'admin' 
            LIMIT 1;
            
            IF admin_role_uuid IS NOT NULL THEN
                -- Adicionar a permissão ao role admin
                INSERT INTO role_permissions (role_id, permission_key) 
                VALUES (admin_role_uuid, 'compras:view')
                ON CONFLICT (role_id, permission_key) DO NOTHING;
                
                RAISE NOTICE 'Permissão compras:view adicionada ao role admin % para usuário %', admin_role_uuid, user_uuid;
            ELSE
                RAISE NOTICE 'Role admin não encontrado para org %', org_uuid;
            END IF;
        ELSE
            RAISE NOTICE 'Organização não encontrada para usuário %', user_uuid;
        END IF;
    ELSE
        RAISE NOTICE 'Usuário não encontrado';
    END IF;
END $$;