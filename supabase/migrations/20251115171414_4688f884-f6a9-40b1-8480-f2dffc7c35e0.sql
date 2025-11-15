-- Fix the RPC function to bypass RLS by disabling row security within the function
-- This is safe because the function has SECURITY DEFINER and SET search_path = public

DROP FUNCTION IF EXISTS public.get_user_profile_for_chat(UUID);

CREATE OR REPLACE FUNCTION public.get_user_profile_for_chat(user_id UUID)
RETURNS TABLE (
  id UUID,
  organizacao_id UUID,
  nome_exibicao TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable RLS for this function execution
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.organizacao_id,
    p.nome_exibicao
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$;

-- Grant execute permission to service_role and authenticated
GRANT EXECUTE ON FUNCTION public.get_user_profile_for_chat(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_profile_for_chat(UUID) TO authenticated;