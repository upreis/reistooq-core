-- Corrigir associação da permissão compras:view ao usuário atual
DO $$
DECLARE
    current_user_id uuid := auth.uid();
    admin_role_id uuid;
    current_org_id uuid;
BEGIN
    -- Obter a organização do usuário atual
    SELECT organizacao_id INTO current_org_id 
    FROM profiles 
    WHERE id = current_user_id 
    LIMIT 1;
    
    IF current_org_id IS NOT NULL THEN
        -- Buscar o role admin da organização
        SELECT id INTO admin_role_id 
        FROM roles 
        WHERE organization_id = current_org_id 
        AND slug = 'admin' 
        LIMIT 1;
        
        IF admin_role_id IS NOT NULL THEN
            -- Garantir que o role admin tenha a permissão compras:view
            INSERT INTO role_permissions (role_id, permission_key) 
            VALUES (admin_role_id, 'compras:view')
            ON CONFLICT (role_id, permission_key) DO NOTHING;
            
            -- Garantir que o usuário tenha o role admin
            INSERT INTO user_role_assignments (user_id, role_id, organization_id) 
            VALUES (current_user_id, admin_role_id, current_org_id)
            ON CONFLICT (user_id, role_id) DO NOTHING;
            
            RAISE NOTICE 'Usuário % associado ao role admin % com permissão compras:view', current_user_id, admin_role_id;
        ELSE
            RAISE NOTICE 'Role admin não encontrado para a organização %', current_org_id;
        END IF;
    ELSE
        RAISE NOTICE 'Organização não encontrada para o usuário %', current_user_id;
    END IF;
END $$;