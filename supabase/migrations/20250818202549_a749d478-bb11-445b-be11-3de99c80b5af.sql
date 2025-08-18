-- Fix the missing RPC function that Edge Functions need to access organization data
-- This resolves the "permission denied for table profiles" error

CREATE OR REPLACE FUNCTION public.get_user_organization_id(target_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT organizacao_id FROM public.profiles WHERE id = target_user_id;
$function$;

-- Grant execute permission to service role for Edge Functions
GRANT EXECUTE ON FUNCTION public.get_user_organization_id(uuid) TO service_role;

-- Also ensure the current org function works properly  
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT organizacao_id FROM public.profiles WHERE id = auth.uid();
$function$;