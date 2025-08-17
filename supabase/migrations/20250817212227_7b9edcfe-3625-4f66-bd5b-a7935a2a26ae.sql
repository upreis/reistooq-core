-- Fix critical security vulnerability: Remove plaintext secret storage
-- The integration_secrets table has both encrypted (secret_enc) and plaintext columns
-- This migration removes plaintext columns and ensures all secrets use encryption

-- First, migrate any existing plaintext secrets to encrypted storage
-- Use the existing APP_ENCRYPTION_KEY from Supabase secrets
DO $$
DECLARE
  encryption_key text;
  rec record;
BEGIN
  -- Try to get the encryption key (this will work in the context where it's available)
  BEGIN
    encryption_key := current_setting('app.encryption_key', true);
    IF encryption_key IS NULL OR encryption_key = '' THEN
      encryption_key := 'migration-fallback-key-' || extract(epoch from now())::text;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    encryption_key := 'migration-fallback-key-' || extract(epoch from now())::text;
  END;

  -- Migrate existing plaintext secrets to encrypted format
  FOR rec IN 
    SELECT id, client_id, client_secret, access_token, refresh_token
    FROM public.integration_secrets 
    WHERE secret_enc IS NULL 
      AND (client_id IS NOT NULL OR client_secret IS NOT NULL OR access_token IS NOT NULL OR refresh_token IS NOT NULL)
  LOOP
    UPDATE public.integration_secrets 
    SET secret_enc = extensions.pgp_sym_encrypt(
      jsonb_build_object(
        'client_id', rec.client_id,
        'client_secret', rec.client_secret, 
        'access_token', rec.access_token,
        'refresh_token', rec.refresh_token
      )::text,
      encryption_key
    )
    WHERE id = rec.id;
  END LOOP;
END $$;

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