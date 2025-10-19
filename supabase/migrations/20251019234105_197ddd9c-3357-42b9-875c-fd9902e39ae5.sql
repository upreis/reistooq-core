-- Corrigir função RPC get_sync_control_status
DROP FUNCTION IF EXISTS public.get_sync_control_status(UUID, TEXT);

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
  SELECT to_jsonb(sync_control) INTO v_result
  FROM public.sync_control
  WHERE integration_account_id = p_integration_account_id
    AND provider = p_provider
  LIMIT 1;

  RETURN v_result;
END;
$$;