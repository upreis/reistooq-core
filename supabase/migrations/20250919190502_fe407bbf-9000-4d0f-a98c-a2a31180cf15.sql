-- Fix invitation system issues: permissions, duplicates prevention, and deletion (v2)

-- 1. Update RLS policies to allow invitations management for admin users
DROP POLICY IF EXISTS "inv_delete_manage" ON public.invitations;
DROP POLICY IF EXISTS "inv_insert_manage" ON public.invitations;
DROP POLICY IF EXISTS "inv_update_manage" ON public.invitations;
DROP POLICY IF EXISTS "inv_select_org_members" ON public.invitations;

-- Create more flexible policies
-- Allow admin users to manage invitations
CREATE POLICY "invitations_admin_full_access" 
ON public.invitations 
FOR ALL 
USING (
  (organization_id = get_current_org_id()) 
  AND (
    has_permission('invites:manage'::text) 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND cargo IN ('admin', 'owner', 'socio')
    )
  )
)
WITH CHECK (
  (organization_id = get_current_org_id()) 
  AND (
    has_permission('invites:manage'::text) 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND cargo IN ('admin', 'owner', 'socio')
    )
  )
);

-- Allow reading invitations for users with read permission
CREATE POLICY "invitations_read_org" 
ON public.invitations 
FOR SELECT 
USING (
  (organization_id = get_current_org_id()) 
  AND (
    has_permission('invites:read'::text) 
    OR 
    has_permission('invites:manage'::text)
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND cargo IN ('admin', 'owner', 'socio')
    )
  )
);

-- 2. Create a function to create invitations with duplicate prevention
CREATE OR REPLACE FUNCTION public.create_invitation_safe(
  p_email text,
  p_role_id uuid,
  p_expires_in_days integer DEFAULT 7
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_existing_invite_id uuid;
  v_new_invitation_id uuid;
  v_expires_at timestamp with time zone;
BEGIN
  -- Get current organization
  v_org_id := public.get_current_org_id();
  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organização não encontrada');
  END IF;
  
  -- Check for existing pending invitation for this email
  SELECT id INTO v_existing_invite_id
  FROM public.invitations 
  WHERE email = p_email 
    AND organization_id = v_org_id 
    AND status = 'pending' 
    AND expires_at > now();
    
  IF v_existing_invite_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Já existe um convite pendente para este email'
    );
  END IF;
  
  -- Check if user already exists in the organization
  IF EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE u.email = p_email 
      AND p.organizacao_id = v_org_id
  ) THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Este usuário já faz parte da organização'
    );
  END IF;
  
  -- Calculate expiration date
  v_expires_at := now() + (p_expires_in_days || ' days')::interval;
  
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
    v_expires_at
  ) RETURNING id INTO v_new_invitation_id;
  
  RETURN json_build_object(
    'success', true, 
    'invitation_id', v_new_invitation_id,
    'message', 'Convite criado com sucesso'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$$;

-- 3. Create function to safely delete invitations (including revoked ones)
CREATE OR REPLACE FUNCTION public.delete_invitation_safe(p_invitation_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_invitation_exists boolean;
BEGIN
  v_org_id := public.get_current_org_id();
  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organização não encontrada');
  END IF;
  
  -- Check if invitation exists and belongs to the organization
  SELECT EXISTS(
    SELECT 1 FROM public.invitations 
    WHERE id = p_invitation_id 
      AND organization_id = v_org_id
  ) INTO v_invitation_exists;
  
  IF NOT v_invitation_exists THEN
    RETURN json_build_object('success', false, 'error', 'Convite não encontrado');
  END IF;
  
  -- Delete the invitation
  DELETE FROM public.invitations 
  WHERE id = p_invitation_id AND organization_id = v_org_id;
  
  RETURN json_build_object('success', true, 'message', 'Convite removido com sucesso');
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;