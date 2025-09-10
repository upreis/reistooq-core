-- Conceder permissões administrativas completas ao usuário nildoreiz@hotmail.com
-- Usar apenas as permissões que existem na tabela app_permissions

DO $$
DECLARE
  v_user uuid := 'c3785644-8d13-4a9d-9e43-9b2589499c50'; -- nildoreiz@hotmail.com
  v_org uuid := '9d52ba63-0de8-4d77-8b57-ed14d3189768'; -- sua organização
BEGIN
  -- Conceder TODAS as permissões administrativas que existem
  INSERT INTO public.user_permission_overrides (user_id, organization_id, permission_key, allow)
  VALUES 
    -- Admin core
    (v_user, v_org, 'admin:access', true),
    (v_user, v_org, 'system:announce', true),
    
    -- View permissions
    (v_user, v_org, 'dashboard:view', true),
    (v_user, v_org, 'analytics:view', true),
    (v_user, v_org, 'historico:view', true),
    (v_user, v_org, 'historico:read_full', true),
    (v_user, v_org, 'estoque:view', true),
    (v_user, v_org, 'oms:view', true),
    (v_user, v_org, 'ecommerce:view', true),
    (v_user, v_org, 'pedidos:view', true),
    (v_user, v_org, 'depara:view', true),
    (v_user, v_org, 'alerts:view', true),
    (v_user, v_org, 'calendar:view', true),
    (v_user, v_org, 'notes:view', true),
    (v_user, v_org, 'userprofile:view', true),
    (v_user, v_org, 'scanner:use', true),
    (v_user, v_org, 'demo:access', true),
    
    -- Management permissions
    (v_user, v_org, 'users:read', true),
    (v_user, v_org, 'users:manage', true),
    (v_user, v_org, 'invites:read', true),
    (v_user, v_org, 'invites:manage', true),
    (v_user, v_org, 'settings:view', true),
    (v_user, v_org, 'settings:manage', true),
    (v_user, v_org, 'integrations:read', true),
    (v_user, v_org, 'integrations:manage', true),
    
    -- Operation permissions  
    (v_user, v_org, 'orders:read', true),
    (v_user, v_org, 'sales:read', true),
    (v_user, v_org, 'vendas:read', true),
    (v_user, v_org, 'vendas:view_pii', true),
    (v_user, v_org, 'customers:read', true),
    (v_user, v_org, 'customers:read_full', true),
    (v_user, v_org, 'customers:view_pii', true),
    (v_user, v_org, 'customers:create', true),
    (v_user, v_org, 'customers:update', true),
    (v_user, v_org, 'customers:delete', true),
    
    -- Content management
    (v_user, v_org, 'estoque:create', true),
    (v_user, v_org, 'estoque:edit', true),
    (v_user, v_org, 'estoque:delete', true),
    (v_user, v_org, 'pedidos:edit', true),
    (v_user, v_org, 'pedidos:process', true),
    (v_user, v_org, 'depara:create', true),
    (v_user, v_org, 'depara:edit', true),
    (v_user, v_org, 'depara:delete', true),
    
    -- Configuration permissions
    (v_user, v_org, 'configuracoes:view', true),
    (v_user, v_org, 'configuracoes:manage_roles', true),
    (v_user, v_org, 'configuracoes:manage_invitations', true)
  ON CONFLICT (user_id, organization_id, permission_key) DO UPDATE
    SET allow = EXCLUDED.allow;
END $$;