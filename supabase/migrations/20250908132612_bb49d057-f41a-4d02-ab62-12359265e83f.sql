-- Ensure app permission exists
INSERT INTO public.app_permissions (key, name, description)
SELECT 'integrations:manage', 'Gerenciar Integrações', 'Permite gerenciar integrações e acessar segredos'
WHERE NOT EXISTS (SELECT 1 FROM public.app_permissions WHERE key = 'integrations:manage');

-- Backfill: grant integrations:manage to all admin roles across orgs (idempotent)
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, 'integrations:manage'
FROM public.roles r
LEFT JOIN public.role_permissions rp
  ON rp.role_id = r.id AND rp.permission_key = 'integrations:manage'
WHERE r.slug = 'admin' AND rp.role_id IS NULL;

-- Function to guarantee the current user can manage integrations in their org
CREATE OR REPLACE FUNCTION public.ensure_integrations_manager_for_current_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_org uuid;
  v_user uuid := auth.uid();
  v_role_id uuid;
  v_perm text := 'integrations:manage';
BEGIN
  v_org := public.get_current_org_id();
  IF v_org IS NULL OR v_user IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'missing_context');
  END IF;

  -- Ensure permission exists
  INSERT INTO public.app_permissions(key, name, description)
  SELECT v_perm, 'Gerenciar Integrações', 'Permite gerenciar integrações e acessar segredos'
  WHERE NOT EXISTS (SELECT 1 FROM public.app_permissions WHERE key = v_perm);

  -- Ensure dedicated role exists in this org
  INSERT INTO public.roles (organization_id, name, slug, is_system)
  SELECT v_org, 'Gerente de Integrações', 'integrations_manager', false
  WHERE NOT EXISTS (
    SELECT 1 FROM public.roles WHERE organization_id = v_org AND slug = 'integrations_manager'
  );

  SELECT id INTO v_role_id FROM public.roles WHERE organization_id = v_org AND slug = 'integrations_manager';

  -- Ensure role has the permission
  INSERT INTO public.role_permissions(role_id, permission_key)
  SELECT v_role_id, v_perm
  WHERE NOT EXISTS (
    SELECT 1 FROM public.role_permissions WHERE role_id = v_role_id AND permission_key = v_perm
  );

  -- Ensure current user is assigned to that role
  INSERT INTO public.user_role_assignments(user_id, role_id, organization_id)
  SELECT v_user, v_role_id, v_org
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_role_assignments WHERE user_id = v_user AND role_id = v_role_id
  );

  RETURN json_build_object('success', true, 'organization_id', v_org, 'role_id', v_role_id);
END;
$$;