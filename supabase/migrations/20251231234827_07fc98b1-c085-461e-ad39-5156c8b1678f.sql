-- Fix invitation acceptance to always create profile row if missing
CREATE OR REPLACE FUNCTION public.accept_invitation_secure(_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv RECORD;
  current_uid uuid;
  current_email text;
BEGIN
  current_uid := auth.uid();
  IF current_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Get current user email
  SELECT email INTO current_email FROM auth.users WHERE id = current_uid;
  IF current_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User email not found');
  END IF;

  -- Validate invitation with security checks
  SELECT * INTO inv
  FROM public.invitations
  WHERE token = _token
    AND status = 'pending'
    AND expires_at > now()
    AND email = current_email  -- Critical: ensure email matches
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid, expired, or unauthorized invitation');
  END IF;

  -- Ensure profile exists, then link it to the organization
  INSERT INTO public.profiles (id, organizacao_id, created_at, updated_at)
  VALUES (current_uid, inv.organization_id, now(), now())
  ON CONFLICT (id) DO UPDATE
    SET organizacao_id = EXCLUDED.organizacao_id,
        updated_at = now();

  -- Add user to role (check for existing assignment first)
  INSERT INTO public.user_role_assignments (user_id, role_id, organization_id)
  VALUES (current_uid, inv.role_id, inv.organization_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = inv.id;

  RETURN json_build_object('success', true, 'organization_id', inv.organization_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', 'Internal error during invitation acceptance');
END;
$$;