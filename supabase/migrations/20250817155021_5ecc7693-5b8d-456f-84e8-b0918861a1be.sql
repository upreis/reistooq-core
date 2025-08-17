-- SECURITY FIX: Properly secure profiles table with comprehensive RLS policies
-- The issue may be that the service_role policy is too broad or there are missing constraints

-- 1) Drop the overly permissive service_role policy and replace with specific ones
DROP POLICY IF EXISTS "profiles_service_all" ON public.profiles;

-- 2) Create specific service role policies for legitimate system operations
CREATE POLICY "profiles_service_insert" 
ON public.profiles
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "profiles_service_update_org" 
ON public.profiles
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- 3) Ensure self-access policies are maintained (these already exist but let's verify)
-- Users can see their own profile
-- CREATE POLICY "profiles_select_self" - already exists

-- Users can update their own profile  
-- CREATE POLICY "profiles_update_self" - already exists

-- 4) Add a policy for organization-based admin access (users with proper permissions)
CREATE POLICY "profiles_admin_access" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (
  -- Allow access if user has admin permissions and target is in same org
  public.has_permission('users:read') 
  AND organizacao_id = public.get_current_org_id()
);

-- 5) Add specific policy for creating new profiles (during signup/onboarding)
CREATE POLICY "profiles_create_self" 
ON public.profiles
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- 6) Ensure no broad grants exist
REVOKE ALL ON public.profiles FROM PUBLIC, anon;

-- Grant only specific access to authenticated users
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated, service_role;
GRANT UPDATE ON public.profiles TO service_role;

-- 7) Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;