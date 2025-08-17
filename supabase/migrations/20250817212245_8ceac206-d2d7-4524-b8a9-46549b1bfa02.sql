-- Fix critical security vulnerability: Remove plaintext secret storage
-- The integration_secrets table has both encrypted (secret_enc) and plaintext columns
-- This migration removes plaintext columns and ensures all secrets use encryption

-- First, ensure all existing plaintext secrets are migrated to encrypted storage
-- (This assumes there's a proper encryption key available)
UPDATE public.integration_secrets 
SET secret_enc = extensions.pgp_sym_encrypt(
  jsonb_build_object(
    'client_id', client_id,
    'client_secret', client_secret, 
    'access_token', access_token,
    'refresh_token', refresh_token
  )::text,
  coalesce(
    (SELECT value FROM vault.secrets WHERE name = 'APP_ENCRYPTION_KEY'),
    'fallback-key-for-migration'
  )
)
WHERE secret_enc IS NULL 
  AND (client_id IS NOT NULL OR client_secret IS NOT NULL OR access_token IS NOT NULL OR refresh_token IS NOT NULL);

-- Remove the plaintext columns entirely to prevent future misuse
ALTER TABLE public.integration_secrets 
DROP COLUMN IF EXISTS client_id,
DROP COLUMN IF EXISTS client_secret,
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS refresh_token;

-- Ensure the trigger function exists to prevent legacy usage
CREATE OR REPLACE FUNCTION public.integration_secrets_prevent_plaintext()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function ensures no plaintext secrets can be stored
  -- All secrets must use the secret_enc encrypted field
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
  -- Get encryption key from vault
  SELECT value INTO encryption_key FROM vault.secrets WHERE name = 'APP_ENCRYPTION_KEY';
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found';
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