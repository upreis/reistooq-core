-- Grant direct SELECT permission on profiles table to service_role
-- This is the cleanest solution for edge functions using service_role

GRANT SELECT ON public.profiles TO service_role;

-- Keep the RPC function as backup but also grant it to anon/authenticated for future use
-- Fix: The function owner needs to be postgres to properly bypass RLS
DROP FUNCTION IF EXISTS public.get_user_profile_for_chat(UUID);

CREATE OR REPLACE FUNCTION public.get_user_profile_for_chat(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  organizacao_id UUID,
  nome_exibicao TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.organizacao_id,
    p.nome_exibicao
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_profile_for_chat(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_profile_for_chat(UUID) TO authenticated;