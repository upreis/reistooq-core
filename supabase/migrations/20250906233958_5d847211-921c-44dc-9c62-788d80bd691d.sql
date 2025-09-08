-- Fix function dependencies by dropping and recreating policy and function

-- 1. Drop the policy that depends on the function
DROP POLICY IF EXISTS "Users can view active announcements in org with audience" ON public.announcements;

-- 2. Drop and recreate the user_matches_announcement function with search_path
DROP FUNCTION IF EXISTS public.user_matches_announcement(uuid[], uuid[]);

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

-- 3. Recreate the policy with the updated function
CREATE POLICY "Users can view active announcements in org with audience" 
ON public.announcements 
FOR SELECT TO authenticated
USING (
  (organization_id = get_current_org_id()) 
  AND (active = true) 
  AND ((expires_at IS NULL) OR (expires_at > now())) 
  AND user_matches_announcement(target_users, target_roles)
);