-- FIX: Secure profiles_safe view with proper RLS policies and grants
-- The view should inherit security from the underlying profiles table and have restricted access

-- 1) First, revoke any existing public access
REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;

-- 2) Grant selective access to authenticated users only
GRANT SELECT ON public.profiles_safe TO authenticated;

-- 3) Ensure the view uses security_invoker and security_barrier for RLS inheritance
ALTER VIEW public.profiles_safe 
  SET (security_invoker = true, security_barrier = true);

-- 4) Enable RLS on the view itself (even though it's a view)
ALTER VIEW public.profiles_safe ENABLE ROW LEVEL SECURITY;

-- 5) Create organization-based RLS policy for the view
CREATE POLICY "profiles_safe_org_access" 
ON public.profiles_safe
FOR SELECT 
TO authenticated
USING (
  -- User can only see profiles from their own organization
  organizacao_id = public.get_current_org_id()
);

-- 6) Verify the underlying profiles table has proper RLS
-- (It already has policies but let's ensure they're sufficient)

-- 7) Also lock down default privileges to prevent future issues
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  REVOKE ALL ON FUNCTIONS FROM PUBLIC;