-- PHASE 1: Critical Security Hardening
-- Lock down legacy "secrets" functions from direct RPC access

-- 1. Revoke EXECUTE permissions on legacy integration secrets functions
REVOKE EXECUTE ON FUNCTION public.get_integration_secret(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_integration_secret(text, text, text) FROM anon, authenticated;

-- 2. Revoke EXECUTE permissions on legacy Tiny v3 credentials functions
REVOKE EXECUTE ON FUNCTION public.tiny3_get_credentials(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tiny3_set_credentials(text, text, text) FROM anon, authenticated;

-- 3. Revoke EXECUTE permissions on legacy invitation functions (keep only secure variants)
REVOKE EXECUTE ON FUNCTION public.accept_invite(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_invitation_token(uuid) FROM anon, authenticated;

-- 4. Enforce encrypted secrets only - create trigger to prevent plaintext storage
CREATE OR REPLACE FUNCTION enforce_encrypted_secrets_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure all secrets must be encrypted via secret_enc column
  IF NEW.secret_enc IS NULL THEN
    RAISE EXCEPTION 'All integration secrets must be encrypted. Use Edge Functions with encrypt_integration_secret.';
  END IF;
  
  -- Nullify any legacy plaintext columns to prevent accidental exposure
  NEW.access_token := NULL;
  NEW.refresh_token := NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply the trigger to integration_secrets table
DROP TRIGGER IF EXISTS enforce_encrypted_secrets_trigger ON public.integration_secrets;
CREATE TRIGGER enforce_encrypted_secrets_trigger
  BEFORE INSERT OR UPDATE ON public.integration_secrets
  FOR EACH ROW EXECUTE FUNCTION enforce_encrypted_secrets_only();

-- 5. Harden views - ensure they use security_invoker and have proper grants
-- Revoke direct access to safe views from anon users
REVOKE ALL ON public.clientes_safe FROM anon;
REVOKE ALL ON public.historico_vendas_safe FROM anon;

-- Only allow authenticated users to access safe views (with proper RLS on source tables)
GRANT SELECT ON public.clientes_safe TO authenticated;
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- 6. Block direct access to sensitive tables - force use of RPC functions only
-- Remove any overly permissive policies on historico_vendas
DROP POLICY IF EXISTS "hv_select_own" ON public.historico_vendas;
DROP POLICY IF EXISTS "hv_insert_own" ON public.historico_vendas;

-- Create restrictive policy that blocks direct table access
CREATE POLICY "historico_vendas_block_direct_access" ON public.historico_vendas
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- 7. Secure the profiles table to prevent PII leakage
-- Drop overly permissive policies if they exist
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Create secure policies that require permission checks
CREATE POLICY "profiles_read_secure" ON public.profiles
  FOR SELECT TO authenticated 
  USING (
    id = auth.uid() OR 
    (organizacao_id = public.get_current_org_id() AND public.has_permission('users:read'))
  );

CREATE POLICY "profiles_update_secure" ON public.profiles
  FOR UPDATE TO authenticated 
  USING (
    id = auth.uid() OR 
    (organizacao_id = public.get_current_org_id() AND public.has_permission('users:update'))
  )
  WITH CHECK (
    id = auth.uid() OR 
    (organizacao_id = public.get_current_org_id() AND public.has_permission('users:update'))
  );

-- 8. Secure the clientes table to prevent customer data exposure
-- Ensure only users with proper permissions can access customer data
CREATE POLICY "clientes_read_with_permissions" ON public.clientes
  FOR SELECT TO authenticated
  USING (
    organization_id = public.get_current_org_id() AND 
    public.has_permission('customers:read')
  );

-- 9. Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "security_audit_admin_only" ON public.security_audit_log
  FOR SELECT TO authenticated
  USING (
    organization_id = public.get_current_org_id() AND 
    public.has_permission('system:audit')
  );

-- Grant necessary permissions
GRANT SELECT ON public.security_audit_log TO authenticated;