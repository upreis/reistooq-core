-- Clean up foreign key dependencies first, then update permissions
-- Step 1: Clear all dependent tables
DELETE FROM public.user_permission_overrides;
DELETE FROM public.role_permissions;

-- Step 2: Now we can safely delete old permissions and insert new ones
DELETE FROM public.app_permissions;

-- Step 3: Insert the new simplified permissions
INSERT INTO public.app_permissions (key, name, description) VALUES
-- DASHBOARD
('dashboard:view', 'Acessar Dashboard', 'Visualizar a página inicial do dashboard'),

-- VENDAS (OMS) - 4 permissões reais
('pedidos:marketplace', 'Vendas Marketplace', 'Acessar página de vendas marketplace (/pedidos)'),
('oms:pedidos', 'Vendas Direta/Atacado', 'Acessar página de vendas direta e atacado (/oms/pedidos)'),
('oms:clientes', 'Clientes', 'Acessar página de clientes (/oms/clientes)'),
('oms:configuracoes', 'Configurações OMS', 'Acessar página de configurações OMS (/oms/configuracoes)'),

-- COMPRAS
('compras:view', 'Acessar Compras', 'Acesso ao módulo de compras'),

-- ESTOQUE - 2 permissões principais
('estoque:view', 'Acessar Estoque', 'Acesso ao módulo de estoque'),
('estoque:compositions', 'Composições', 'Acessar composições de produtos'),

-- ECOMMERCE
('ecommerce:view', 'Acessar eCommerce', 'Acesso ao módulo eCommerce'),

-- CONFIGURAÇÕES
('configuracoes:view', 'Acessar Configurações', 'Acesso às configurações do sistema'),

-- ADMINISTRAÇÃO
('admin:access', 'Acessar Administração', 'Acesso ao módulo de administração'),

-- APLICATIVOS - 2 permissões
('calendar:view', 'Calendário Logístico', 'Acessar aplicativo de calendário logístico'),
('notes:view', 'Notas', 'Acessar aplicativo de notas'),

-- FERRAMENTAS - 2 permissões principais
('scanner:use', 'Scanner', 'Utilizar ferramenta de scanner'),
('depara:view', 'De-Para', 'Acessar ferramenta de de-para');

-- Step 4: Reassign all permissions to admin role for the current organization
DO $$
DECLARE
    admin_role_id uuid;
BEGIN
    -- Get current organization admin role
    SELECT id INTO admin_role_id 
    FROM public.roles 
    WHERE slug = 'admin' 
    AND organization_id = public.get_current_org_id()
    LIMIT 1;
    
    IF admin_role_id IS NOT NULL THEN
        -- Assign all new permissions to admin role
        INSERT INTO public.role_permissions (role_id, permission_key)
        SELECT admin_role_id, key 
        FROM public.app_permissions
        ON CONFLICT (role_id, permission_key) DO NOTHING;
    END IF;
END $$;