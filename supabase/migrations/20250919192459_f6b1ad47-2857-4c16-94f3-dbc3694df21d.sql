-- Update the create_invitation_safe function to trigger email sending
CREATE OR REPLACE FUNCTION public.create_invitation_safe(
  p_email text,
  p_role_id uuid,
  p_expires_in_days integer DEFAULT 7
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_invitation_id uuid;
  v_user_exists boolean := false;
  v_pending_exists boolean := false;
BEGIN
  -- Get current organization
  v_org_id := public.get_current_org_id();
  
  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organization not found');
  END IF;

  -- Check if user already exists in this organization
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.id IN (SELECT id FROM auth.users WHERE email = p_email)
    AND p.organizacao_id = v_org_id
  ) INTO v_user_exists;
  
  IF v_user_exists THEN
    RETURN json_build_object('success', false, 'error', 'User already exists in this organization');
  END IF;
  
  -- Check for existing pending invitation
  SELECT EXISTS(
    SELECT 1 FROM public.invitations 
    WHERE email = p_email 
    AND organization_id = v_org_id 
    AND status = 'pending'
    AND expires_at > now()
  ) INTO v_pending_exists;
  
  IF v_pending_exists THEN
    RETURN json_build_object('success', false, 'error', 'Pending invitation already exists for this email');
  END IF;
  
  -- Create the invitation
  INSERT INTO public.invitations (
    email,
    role_id,
    organization_id,
    invited_by,
    expires_at
  ) VALUES (
    p_email,
    p_role_id,
    v_org_id,
    auth.uid(),
    now() + (p_expires_in_days || ' days')::interval
  )
  RETURNING id INTO v_invitation_id;
  
  -- Return success with invitation_id for email sending
  RETURN json_build_object(
    'success', true, 
    'invitation_id', v_invitation_id,
    'message', 'Invitation created successfully'
  );
END;
$$;