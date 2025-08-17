-- Enhance security for integration_secrets table
-- Ensure all secrets are properly encrypted and enforce encryption

-- Create function to enforce encrypted storage only
CREATE OR REPLACE FUNCTION public.integration_secrets_prevent_plaintext()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure all secrets must be encrypted
  IF NEW.secret_enc IS NULL THEN
    RAISE EXCEPTION 'All integration secrets must be encrypted. Use the encrypt_integration_secret function.';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce encrypted storage
DROP TRIGGER IF EXISTS integration_secrets_enforce_encryption ON public.integration_secrets;
CREATE TRIGGER integration_secrets_enforce_encryption
  BEFORE INSERT OR UPDATE ON public.integration_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.integration_secrets_prevent_plaintext();

-- Update the secure access function to only work with encrypted data
CREATE OR REPLACE FUNCTION public.get_integration_secret_secure(account_id uuid, provider_name text, requesting_function text DEFAULT 'unknown'::text)
RETURNS TABLE(access_token text, refresh_token text, client_id text, client_secret text, expires_at timestamp with time zone, payload jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  secret_data jsonb;
  encryption_key text;
BEGIN
  -- Get encryption key from vault or environment
  SELECT value INTO encryption_key FROM vault.secrets WHERE name = 'APP_ENCRYPTION_KEY' LIMIT 1;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;
  
  -- Decrypt and parse secret data
  SELECT extensions.pgp_sym_decrypt(s.secret_enc, encryption_key)::jsonb INTO secret_data
  FROM public.integration_secrets s
  WHERE s.integration_account_id = account_id 
    AND s.provider = provider_name;
    
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Log access to audit table (fire and forget)
  BEGIN
    INSERT INTO public.integration_secrets_audit (
      integration_account_id,
      provider,
      action,
      requesting_function,
      user_id,
      created_at
    ) VALUES (
      account_id,
      provider_name,
      'access',
      requesting_function,
      auth.uid(),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Return the decrypted secret data
  RETURN QUERY SELECT 
    secret_data->>'access_token',
    secret_data->>'refresh_token',
    secret_data->>'client_id',
    secret_data->>'client_secret',
    CASE 
      WHEN secret_data->>'expires_at' IS NOT NULL 
      THEN (secret_data->>'expires_at')::timestamp with time zone
      ELSE NULL
    END,
    secret_data->'payload';
END;
$$;

-- Ensure the encrypt function is properly secured
CREATE OR REPLACE FUNCTION public.encrypt_integration_secret(
  p_account_id uuid, 
  p_provider text, 
  p_client_id text DEFAULT NULL::text, 
  p_client_secret text DEFAULT NULL::text, 
  p_access_token text DEFAULT NULL::text, 
  p_refresh_token text DEFAULT NULL::text, 
  p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone, 
  p_payload jsonb DEFAULT NULL::jsonb, 
  p_encryption_key text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  secret_id uuid;
  secret_data jsonb;
  encryption_key text;
BEGIN
  -- Get encryption key from vault if not provided
  IF p_encryption_key IS NULL THEN
    SELECT value INTO encryption_key FROM vault.secrets WHERE name = 'APP_ENCRYPTION_KEY' LIMIT 1;
    IF encryption_key IS NULL THEN
      RAISE EXCEPTION 'Encryption key not found in vault';
    END IF;
  ELSE
    encryption_key := p_encryption_key;
  END IF;

  -- Build secret data JSON
  secret_data := jsonb_build_object(
    'client_id', p_client_id,
    'client_secret', p_client_secret,
    'access_token', p_access_token,
    'refresh_token', p_refresh_token,
    'expires_at', p_expires_at,
    'payload', p_payload
  );

  -- Insert or update encrypted secret
  INSERT INTO public.integration_secrets (
    integration_account_id,
    provider,
    organization_id,
    secret_enc,
    expires_at,
    payload,
    created_at,
    updated_at
  ) VALUES (
    p_account_id,
    p_provider,
    public.get_current_org_id(),
    extensions.pgp_sym_encrypt(secret_data::text, encryption_key),
    p_expires_at,
    p_payload,
    now(),
    now()
  )
  ON CONFLICT (integration_account_id, provider) 
  DO UPDATE SET
    secret_enc = extensions.pgp_sym_encrypt(secret_data::text, encryption_key),
    expires_at = p_expires_at,
    payload = p_payload,
    updated_at = now()
  RETURNING id INTO secret_id;

  RETURN secret_id;
END;
$$;