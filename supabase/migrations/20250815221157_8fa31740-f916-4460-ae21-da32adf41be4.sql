-- Complete the security fix with remaining functions and audit logging

-- Add function to securely accept invitations
CREATE OR REPLACE FUNCTION public.accept_invitation_secure(_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Update user profile to join the organization
  UPDATE public.profiles
  SET organizacao_id = inv.organization_id, updated_at = now()
  WHERE id = current_uid;

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

-- Fix the validate_invitation_token function to have proper search path
CREATE OR REPLACE FUNCTION public.validate_invitation_token(_token uuid)
RETURNS TABLE(
  is_valid boolean,
  organization_name text,
  role_name text,
  expires_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Get invitation details with joined data
  SELECT 
    i.*,
    o.nome as org_name,
    r.name as role_name
  INTO invite_record
  FROM public.invitations i
  JOIN public.organizacoes o ON o.id = i.organization_id
  JOIN public.roles r ON r.id = i.role_id
  WHERE i.token = _token
    AND i.status = 'pending'
    AND i.expires_at > now();
  
  IF FOUND THEN
    -- Return safe information without exposing email or other sensitive data
    RETURN QUERY SELECT 
      true as is_valid,
      invite_record.org_name as organization_name,
      invite_record.role_name as role_name,
      invite_record.expires_at;
  ELSE
    -- Return invalid result
    RETURN QUERY SELECT 
      false as is_valid,
      null::text as organization_name,
      null::text as role_name,
      null::timestamp with time zone as expires_at;
  END IF;
END;
$$;

-- Add audit logging for invitation access
CREATE TABLE IF NOT EXISTS public.invitation_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES public.invitations(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.invitation_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "invitation_audit_admin_only" 
ON public.invitation_audit_log 
FOR ALL 
TO authenticated
USING (public.has_permission('system:audit'))
WITH CHECK (public.has_permission('system:audit'));

-- Add indexes for performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_invitations_org_status ON public.invitations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_email_status ON public.invitations(email, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token) WHERE status = 'pending';

-- Add comments for documentation
COMMENT ON POLICY "invitations_secure_select" ON public.invitations IS 
'Secure policy preventing cross-organization email leakage and unauthorized access to invitation data';

COMMENT ON FUNCTION public.validate_invitation_token IS 
'Safely validates invitation tokens without exposing sensitive email or user data';

COMMENT ON FUNCTION public.accept_invitation_secure IS 
'Securely processes invitation acceptance with proper email verification';