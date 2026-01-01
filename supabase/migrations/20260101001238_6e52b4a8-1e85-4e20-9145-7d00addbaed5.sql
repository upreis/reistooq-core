
-- Função segura para excluir usuário da organização (não exclui o usuário do auth, apenas desvincula)
CREATE OR REPLACE FUNCTION public.remove_user_from_organization(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_uid uuid;
  current_org uuid;
  target_org uuid;
  is_admin boolean;
BEGIN
  current_uid := auth.uid();
  IF current_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Get current user's organization
  SELECT organizacao_id INTO current_org FROM public.profiles WHERE id = current_uid;
  IF current_org IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Current user has no organization');
  END IF;

  -- Check if current user has permission to manage users
  SELECT EXISTS(
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.organization_roles r ON ura.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.app_permissions p ON rp.permission_key = p.key
    WHERE ura.user_id = current_uid
      AND p.key = 'users:manage'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Get target user's organization
  SELECT organizacao_id INTO target_org FROM public.profiles WHERE id = target_user_id;
  
  -- Verify target user is in the same organization
  IF target_org IS NULL OR target_org != current_org THEN
    RETURN json_build_object('success', false, 'error', 'User not found in your organization');
  END IF;

  -- Cannot delete yourself
  IF target_user_id = current_uid THEN
    RETURN json_build_object('success', false, 'error', 'Cannot remove yourself from organization');
  END IF;

  -- Remove user from organization by clearing organizacao_id
  UPDATE public.profiles
  SET organizacao_id = NULL, updated_at = now()
  WHERE id = target_user_id;

  -- Remove all role assignments in this organization
  DELETE FROM public.user_role_assignments
  WHERE user_id = target_user_id
    AND organization_id = current_org;

  RETURN json_build_object('success', true, 'message', 'User removed from organization');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', 'Internal error during user removal');
END;
$$;
