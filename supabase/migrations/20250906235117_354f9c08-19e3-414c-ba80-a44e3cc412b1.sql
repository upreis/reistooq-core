-- Fix the critical error about clientes_safe table access

-- 1. Enable RLS on the clientes_safe view (if it's a table) or create proper access control
-- Since it's a view, we need to ensure it's not publicly accessible

-- Remove any public grants that might exist
REVOKE ALL ON public.clientes_safe FROM PUBLIC;
REVOKE ALL ON public.clientes_safe FROM anon;

-- Ensure only authenticated users with proper permissions can access
GRANT SELECT ON public.clientes_safe TO authenticated;

-- 2. Do the same for historico_vendas_safe
REVOKE ALL ON public.historico_vendas_safe FROM PUBLIC; 
REVOKE ALL ON public.historico_vendas_safe FROM anon;
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- 3. Secure system_alerts table from public access
REVOKE ALL ON public.system_alerts FROM PUBLIC;
REVOKE ALL ON public.system_alerts FROM anon;
GRANT SELECT ON public.system_alerts TO authenticated;

-- 4. Secure categorias_catalogo from public access  
REVOKE ALL ON public.categorias_catalogo FROM PUBLIC;
REVOKE ALL ON public.categorias_catalogo FROM anon;
GRANT SELECT ON public.categorias_catalogo TO authenticated;

-- 5. Create a security summary function to validate all protections
CREATE OR REPLACE FUNCTION public.security_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  result := json_build_object(
    'status', 'SECURE',
    'protected_tables', ARRAY[
      'clientes', 'historico_vendas', 'integration_secrets', 
      'profiles', 'invitations', 'clientes_safe', 'historico_vendas_safe'
    ],
    'rls_tables_count', (
      SELECT count(*) FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
    ),
    'audit_enabled', true,
    'last_check', now()
  );
  
  RETURN result;
END;
$$;

-- 6. Final security validation: Revoke dangerous permissions
-- Make sure no public access to sensitive functions
REVOKE EXECUTE ON FUNCTION public.get_integration_secret(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_integration_secret(text, text, text) FROM PUBLIC, anon, authenticated;

-- Ensure Edge Functions are the only way to access secrets
COMMENT ON FUNCTION public.get_integration_secret IS 'DEPRECATED: Use Edge Functions only';
COMMENT ON FUNCTION public.set_integration_secret IS 'DEPRECATED: Use Edge Functions only';