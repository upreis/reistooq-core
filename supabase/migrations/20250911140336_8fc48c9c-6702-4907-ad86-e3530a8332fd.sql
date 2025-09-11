-- 🔧 CORREÇÃO: Permitir refresh de tokens pelas edge functions

-- Criar função específica para refresh de tokens que pode ser chamada pelas edge functions
CREATE OR REPLACE FUNCTION public.refresh_ml_token(
  p_account_id uuid,
  p_new_access_token text,
  p_new_refresh_token text,
  p_expires_at timestamp with time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_account_exists boolean := false;
BEGIN
  -- Verificar se a conta existe e está ativa
  SELECT EXISTS(
    SELECT 1 FROM public.integration_accounts 
    WHERE id = p_account_id 
    AND provider = 'mercadolivre' 
    AND is_active = true
  ) INTO v_account_exists;
  
  IF NOT v_account_exists THEN
    RETURN json_build_object('success', false, 'error', 'Account not found or inactive');
  END IF;
  
  -- Atualizar os tokens usando simple encryption
  UPDATE public.integration_secrets 
  SET 
    simple_tokens = public.encrypt_simple(
      json_build_object(
        'access_token', p_new_access_token,
        'refresh_token', p_new_refresh_token,
        'expires_at', extract(epoch from p_expires_at)
      )::text
    ),
    expires_at = p_expires_at,
    updated_at = now(),
    last_accessed_at = now(),
    access_count = access_count + 1
  WHERE integration_account_id = p_account_id 
  AND provider = 'mercadolivre';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Secret not found');
  END IF;
  
  -- Log da operação
  PERFORM public.log_secret_access(
    p_account_id, 
    'mercadolivre', 
    'token_refresh', 
    'refresh_ml_token', 
    true
  );
  
  RETURN json_build_object('success', true, 'updated_at', now());
END;
$function$;

-- Permitir que edge functions chamem esta função
GRANT EXECUTE ON FUNCTION public.refresh_ml_token TO anon, authenticated;