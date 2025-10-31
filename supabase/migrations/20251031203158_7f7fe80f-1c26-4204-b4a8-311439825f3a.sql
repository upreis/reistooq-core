-- Drop the existing function first
DROP FUNCTION IF EXISTS public.decrypt_simple(text);

-- Recreate decrypt_simple with correct single-layer base64 handling
CREATE FUNCTION public.decrypt_simple(encrypted_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decoded_text text;
  json_text text;
BEGIN
  -- Decode from base64 (single layer)
  decoded_text := convert_from(decode(encrypted_text, 'base64'), 'UTF8');
  
  -- Remove SALT2024:: prefix
  IF decoded_text LIKE 'SALT2024::%' THEN
    json_text := substring(decoded_text from 10);  -- Skip "SALT2024::"
  ELSE
    RAISE EXCEPTION 'Invalid format: SALT2024:: prefix not found';
  END IF;
  
  -- Parse JSON directly (no second base64 decode)
  RETURN json_text::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Decryption failed: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.decrypt_simple(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_simple(text) TO service_role;