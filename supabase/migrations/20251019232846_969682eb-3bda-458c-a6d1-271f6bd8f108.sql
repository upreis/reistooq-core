-- Função RPC para buscar status de sincronização
CREATE OR REPLACE FUNCTION public.get_sync_control_status(
  p_integration_account_id UUID,
  p_provider TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT row_to_json(sc.*)::jsonb INTO v_result
  FROM public.sync_control sc
  WHERE sc.integration_account_id = p_integration_account_id
    AND sc.provider = p_provider
  LIMIT 1;

  RETURN v_result;
END;
$$;