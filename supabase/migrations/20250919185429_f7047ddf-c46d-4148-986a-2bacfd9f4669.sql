-- Fix RLS policies for system_alerts table to allow admin users to create/manage alerts
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "system_alerts_admin_manage" ON public.system_alerts;

-- Create new policies for system alerts management
-- Allow authenticated admin users to create alerts
CREATE POLICY "system_alerts_admin_create" 
ON public.system_alerts 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    -- Check if user has admin role or is owner
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND cargo IN ('admin', 'owner', 'socio')
    )
    OR
    -- Or if user has specific permission
    has_permission('system:alerts'::text)
  )
);

-- Allow authenticated admin users to update alerts
CREATE POLICY "system_alerts_admin_update" 
ON public.system_alerts 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Check if user has admin role or is owner  
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND cargo IN ('admin', 'owner', 'socio')
    )
    OR
    -- Or if user has specific permission
    has_permission('system:alerts'::text)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    -- Check if user has admin role or is owner
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND cargo IN ('admin', 'owner', 'socio')
    )
    OR
    -- Or if user has specific permission
    has_permission('system:alerts'::text)
  )
);

-- Allow authenticated admin users to delete alerts
CREATE POLICY "system_alerts_admin_delete" 
ON public.system_alerts 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Check if user has admin role or is owner
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND cargo IN ('admin', 'owner', 'socio')
    )
    OR
    -- Or if user has specific permission
    has_permission('system:alerts'::text)
  )
);

-- Ensure organization_id and created_by are properly set
-- Update the existing policies to be more permissive for admin operations
-- while still maintaining security