-- Create a secure RPC function to get user profile that bypasses RLS
-- This is needed because even service_role is being blocked

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
  RETURN QUERY
  SELECT 
    p.id,
    p.organizacao_id,
    p.nome_exibicao
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.get_user_profile_for_chat(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_profile_for_chat(UUID) TO authenticated;