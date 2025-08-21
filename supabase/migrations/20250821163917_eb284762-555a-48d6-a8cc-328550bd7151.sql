-- Criar/atualizar função RPC encrypt_integration_secret com parâmetros corretos
CREATE OR REPLACE FUNCTION public.encrypt_integration_secret(
  p_account_id uuid,
  p_provider text,
  p_client_id text,
  p_client_secret text,
  p_access_token text,
  p_refresh_token text,
  p_expires_at text,
  p_encryption_key text,
  p_payload jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  secret_data jsonb;
  encrypted_data bytea;
BEGIN
  -- Validate inputs
  IF p_account_id IS NULL THEN
    RAISE EXCEPTION 'account_id cannot be null';
  END IF;
  
  IF COALESCE(p_provider, '') = '' THEN
    RAISE EXCEPTION 'provider cannot be empty';
  END IF;
  
  IF COALESCE(p_encryption_key, '') = '' THEN
    RAISE EXCEPTION 'encryption_key cannot be empty';
  END IF;

  -- Build secret data JSON
  secret_data := jsonb_build_object(
    'client_id', p_client_id,
    'client_secret', p_client_secret,
    'access_token', p_access_token,
    'refresh_token', p_refresh_token,
    'expires_at', p_expires_at,
    'payload', COALESCE(p_payload, '{}'::jsonb)
  );

  -- Encrypt the secret data
  encrypted_data := pgp_sym_encrypt(secret_data::text, p_encryption_key);

  -- Get organization_id from the integration account
  INSERT INTO public.integration_secrets (
    integration_account_id,
    provider,
    organization_id,
    secret_enc,
    created_at,
    updated_at
  )
  SELECT 
    p_account_id,
    p_provider,
    ia.organization_id,
    encrypted_data,
    now(),
    now()
  FROM public.integration_accounts ia
  WHERE ia.id = p_account_id
  ON CONFLICT (integration_account_id, provider) 
  DO UPDATE SET 
    secret_enc = EXCLUDED.secret_enc,
    updated_at = now();

  -- Log the operation for audit
  PERFORM public.log_secret_access(
    p_account_id,
    p_provider,
    'encrypt_success',
    'encrypt_integration_secret',
    true,
    null
  );

EXCEPTION WHEN OTHERS THEN
  -- Log failed access
  PERFORM public.log_secret_access(
    p_account_id,
    p_provider,
    'encrypt_failed',
    'encrypt_integration_secret',
    false,
    SQLERRM
  );
  RAISE;
END;
$$;