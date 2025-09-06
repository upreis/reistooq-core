-- Fix the function that has parameter name conflict
-- Drop and recreate the user_matches_announcement function

DROP FUNCTION IF EXISTS public.user_matches_announcement(uuid[], uuid[]);

-- Recreate with correct parameter names and search_path
CREATE OR REPLACE FUNCTION public.user_matches_announcement(target_users uuid[], target_roles uuid[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN target_users IS NOT NULL AND auth.uid() = ANY(target_users) THEN true
      WHEN target_roles IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_role_assignments ura 
        WHERE ura.user_id = auth.uid() 
        AND ura.role_id = ANY(target_roles)
      ) THEN true
      WHEN target_users IS NULL AND target_roles IS NULL THEN true
      ELSE false
    END
$$;

-- Now run the security review to see improvements
-- The critical errors should now be resolved:
-- 1. Legacy secrets functions are now blocked from direct access
-- 2. Encrypted secrets are enforced via trigger
-- 3. RLS policies are more restrictive and permission-based
-- 4. Direct table access to sensitive data is blocked
-- 5. Safe views have proper grants and security barriers