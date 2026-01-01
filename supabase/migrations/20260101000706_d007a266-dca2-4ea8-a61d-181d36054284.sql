
-- Função para verificar e aceitar automaticamente convite pendente para o email do usuário
CREATE OR REPLACE FUNCTION public.auto_accept_pending_invitation()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_uid uuid;
  current_email text;
  inv RECORD;
BEGIN
  current_uid := auth.uid();
  IF current_uid IS NULL THEN
    RETURN json_build_object('accepted', false, 'reason', 'not_authenticated');
  END IF;

  -- Get current user email
  SELECT email INTO current_email FROM auth.users WHERE id = current_uid;
  IF current_email IS NULL THEN
    RETURN json_build_object('accepted', false, 'reason', 'email_not_found');
  END IF;

  -- Find pending invitation for this email
  SELECT * INTO inv
  FROM public.invitations
  WHERE email = current_email
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('accepted', false, 'reason', 'no_pending_invitation');
  END IF;

  -- Accept the invitation: update profile and assign role
  INSERT INTO public.profiles (id, organizacao_id, created_at, updated_at)
  VALUES (current_uid, inv.organization_id, now(), now())
  ON CONFLICT (id) DO UPDATE
    SET organizacao_id = EXCLUDED.organizacao_id,
        updated_at = now();

  -- Add user to role
  INSERT INTO public.user_role_assignments (user_id, role_id, organization_id)
  VALUES (current_uid, inv.role_id, inv.organization_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = inv.id;

  RETURN json_build_object(
    'accepted', true, 
    'organization_id', inv.organization_id,
    'invitation_id', inv.id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('accepted', false, 'reason', 'internal_error');
END;
$$;
