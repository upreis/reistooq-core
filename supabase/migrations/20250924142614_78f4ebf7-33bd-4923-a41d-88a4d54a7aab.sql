-- Update RLS policies to use the new simplified permission system
-- Fix roles table policies
DROP POLICY IF EXISTS "roles: mutate by managers" ON public.roles;
CREATE POLICY "roles: mutate by managers" ON public.roles
FOR ALL USING (
  (organization_id = get_current_org_id()) AND 
  has_permission('admin:access'::text)
) WITH CHECK (
  (organization_id = get_current_org_id()) AND 
  has_permission('admin:access'::text)
);

-- Fix role_permissions table policies  
DROP POLICY IF EXISTS "role_permissions: mutate by managers" ON public.role_permissions;
CREATE POLICY "role_permissions: mutate by managers" ON public.role_permissions
FOR ALL USING (
  (EXISTS (
    SELECT 1 FROM roles r 
    WHERE r.id = role_permissions.role_id 
    AND r.organization_id = get_current_org_id()
  )) AND 
  has_permission('admin:access'::text)
) WITH CHECK (
  (EXISTS (
    SELECT 1 FROM roles r 
    WHERE r.id = role_permissions.role_id 
    AND r.organization_id = get_current_org_id()
  )) AND 
  has_permission('admin:access'::text)
);