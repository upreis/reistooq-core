-- Fix RLS policies for invitation system
-- The edge function is having permission denied errors when trying to read invitation data

-- First, fix the service role policies for the invitations table
DROP POLICY IF EXISTS "invitations_service_role_read" ON invitations;

-- Allow service role to read invitations (for edge function)
CREATE POLICY "invitations_service_role_read" ON invitations
FOR SELECT USING (
  current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
);

-- Also allow service role to read roles table  
DROP POLICY IF EXISTS "roles_service_role_read" ON roles;

CREATE POLICY "roles_service_role_read" ON roles
FOR SELECT USING (
  current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
);

-- Fix the edge function issue with organizacoes table
-- The edge function is looking for 'organizacoes' but we have 'organizations'
-- Let's create a policy for organizations table too
CREATE POLICY "organizations_service_role_read" ON organizacoes
FOR SELECT USING (
  current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
);