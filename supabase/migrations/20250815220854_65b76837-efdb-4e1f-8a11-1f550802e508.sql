-- Security Fix for Invitations Table - Corrected Version
-- Issue: Customer Email Addresses and Personal Data Could Be Stolen

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "invites: select manage or own" ON public.invitations;
DROP POLICY IF EXISTS "invites: mutate by org with invites:manage" ON public.invitations;

-- Create more secure RLS policies

-- Policy 1: Only organization managers can INSERT invitations
CREATE POLICY "invitations_secure_insert" 
ON public.invitations 
FOR INSERT 
TO authenticated
WITH CHECK (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('invites:manage')
);

-- Policy 2: Only organization managers can UPDATE invitations within their org
CREATE POLICY "invitations_secure_update" 
ON public.invitations 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('invites:manage')
)
WITH CHECK (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('invites:manage')
);

-- Policy 3: Only organization managers can DELETE invitations within their org
CREATE POLICY "invitations_secure_delete" 
ON public.invitations 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('invites:manage')
);

-- Policy 4: Restricted SELECT access - only for organization managers or specific invitation recipients
CREATE POLICY "invitations_secure_select" 
ON public.invitations 
FOR SELECT 
TO authenticated
USING (
  -- Organization managers can see all invites in their org
  (
    organization_id = public.get_current_org_id() 
    AND public.has_permission('invites:read')
  )
  OR
  -- Invited users can ONLY see their own pending invitation within the current org context
  -- This prevents cross-organization email leakage
  (
    organization_id = public.get_current_org_id()
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
    AND expires_at > now()
  )
);

-- Add a function to safely check invitation validity without exposing sensitive data
CREATE OR REPLACE FUNCTION public.validate_invitation_token(_token uuid)
RETURNS TABLE(
  is_valid boolean,
  organization_name text,
  role_name text,
  expires_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
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