-- ============================================================
-- REVERT: Restore Base64 encryption for backwards compatibility
-- ============================================================
-- The previous AES-256 migration broke decryption of existing data
-- Reverting to Base64 encoding to restore system functionality

-- Drop the AES-256 functions
DROP FUNCTION IF EXISTS public.encrypt_simple(text);
DROP FUNCTION IF EXISTS public.decrypt_simple(text);

-- Restore original Base64 encryption function
CREATE OR REPLACE FUNCTION public.encrypt_simple(data text) 
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple Base64 encoding with salt prefix for backwards compatibility
  RETURN 'SALT2024::' || encode(data::bytea, 'base64');
END;
$$;

-- Restore original Base64 decryption function
CREATE OR REPLACE FUNCTION public.decrypt_simple(encrypted_data text)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove salt prefix and decode Base64
  IF encrypted_data LIKE 'SALT2024::%' THEN
    RETURN convert_from(decode(substring(encrypted_data from 11), 'base64'), 'UTF8');
  ELSE
    -- Fallback for data without salt prefix
    RETURN convert_from(decode(encrypted_data, 'base64'), 'UTF8');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to decrypt data: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Set proper permissions
REVOKE ALL ON FUNCTION public.encrypt_simple(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrypt_simple(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.encrypt_simple(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_simple(text) TO service_role;