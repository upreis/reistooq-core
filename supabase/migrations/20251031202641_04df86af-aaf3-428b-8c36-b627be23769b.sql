-- Fix decrypt_simple to handle base64 encoded data from storage
-- The data is stored as base64 in the database, so we need to decode it first

DROP FUNCTION IF EXISTS public.decrypt_simple(text);

CREATE OR REPLACE FUNCTION public.decrypt_simple(encrypted_data text)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decoded_data text;
BEGIN
  -- First, try to decode from base64 (data comes base64-encoded from storage)
  BEGIN
    decoded_data := convert_from(decode(encrypted_data, 'base64'), 'UTF8');
  EXCEPTION
    WHEN OTHERS THEN
      -- If base64 decode fails, assume it's already plain text
      decoded_data := encrypted_data;
  END;
  
  -- Now decrypt: Remove salt prefix and decode the actual data
  IF decoded_data LIKE 'SALT2024::%' THEN
    RETURN convert_from(decode(substring(decoded_data from 11), 'base64'), 'UTF8');
  ELSE
    -- Fallback: try to decode directly (legacy format)
    RETURN convert_from(decode(decoded_data, 'base64'), 'UTF8');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to decrypt data: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Set proper permissions
REVOKE ALL ON FUNCTION public.decrypt_simple(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrypt_simple(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_simple(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_simple(text) TO anon;