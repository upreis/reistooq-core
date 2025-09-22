-- ===================================================================
-- SECURITY ENHANCEMENT: Restrict Direct Access to Clientes Table
-- ===================================================================
-- This migration blocks direct access to the clientes table and forces
-- all access through secure views and RPC functions that provide data masking.

-- 1. Drop existing permissive RLS policies on clientes table
DROP POLICY IF EXISTS "clientes_secure_read" ON public.clientes;
DROP POLICY IF EXISTS "clientes_secure_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_secure_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_secure_delete" ON public.clientes;

-- 2. Create highly restrictive read policy that requires sensitive data permission
-- This effectively blocks most users from direct table access
CREATE POLICY "clientes_direct_access_restricted" ON public.clientes
  FOR SELECT USING (
    organization_id = get_current_org_id() 
    AND has_permission('customers:read') 
    AND has_permission('customers:view_sensitive')  -- Requires specific permission for sensitive data
    AND auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND users.last_sign_in_at > (now() - '7 days'::interval)
    )
  );

-- 3. Create restrictive write policies that require administrative permissions
CREATE POLICY "clientes_admin_insert" ON public.clientes
  FOR INSERT WITH CHECK (
    organization_id = get_current_org_id() 
    AND has_permission('customers:create')
    AND has_permission('customers:manage') -- Requires management permission
  );

CREATE POLICY "clientes_admin_update" ON public.clientes
  FOR UPDATE USING (
    organization_id = get_current_org_id() 
    AND has_permission('customers:update')
    AND has_permission('customers:manage') -- Requires management permission
  );

CREATE POLICY "clientes_admin_delete" ON public.clientes
  FOR DELETE USING (
    organization_id = get_current_org_id() 
    AND has_permission('customers:delete')
    AND has_permission('customers:manage') -- Requires management permission
  );

-- 4. Add additional permission for customers management to app_permissions if not exists
INSERT INTO public.app_permissions (key, name, description) 
VALUES (
  'customers:manage',
  'Manage Customers',
  'Permission to directly manage customer data (create, update, delete). Users without this permission must use secure views.'
) ON CONFLICT (key) DO NOTHING;

-- 5. Create a comment on the table to warn developers
COMMENT ON TABLE public.clientes IS 'SECURITY WARNING: Direct access to this table is restricted. Use clientes_secure view or secure RPC functions (get_customer_secure, search_customers_secure) for data access with automatic PII masking.';

-- 6. Revoke direct access permissions and grant secure function access
REVOKE ALL ON public.clientes FROM authenticated;
-- Users should only access through secure view and functions
GRANT SELECT ON public.clientes_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_customers_secure(text, text, text, text, integer, integer) TO authenticated;