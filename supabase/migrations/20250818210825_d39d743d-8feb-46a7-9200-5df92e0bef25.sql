-- Corrigir warnings de segurança: adicionar SET search_path às funções

-- Corrigir função get_org_id_from_oauth_state
CREATE OR REPLACE FUNCTION public.get_org_id_from_oauth_state(p_state_value TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id 
  FROM public.oauth_states 
  WHERE state_value = p_state_value 
    AND expires_at > now() 
    AND used = false
  LIMIT 1;
$$;

-- Corrigir função mark_oauth_state_used
CREATE OR REPLACE FUNCTION public.mark_oauth_state_used(p_state_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE public.oauth_states 
  SET used = true 
  WHERE state_value = p_state_value 
    AND expires_at > now() 
    AND used = false;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;