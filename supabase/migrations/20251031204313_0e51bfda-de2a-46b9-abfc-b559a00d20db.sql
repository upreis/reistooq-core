-- Fix decrypt_simple substring position (PostgreSQL uses 1-based indexing)
DROP FUNCTION IF EXISTS public.decrypt_simple(text);

CREATE FUNCTION public.decrypt_simple(encrypted_data text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decoded_text text;
  json_text text;
BEGIN
  -- Decode from base64
  decoded_text := convert_from(decode(encrypted_data, 'base64'), 'UTF8');
  
  -- Remove SALT2024:: prefix (10 characters) and trim whitespace
  -- PostgreSQL substring is 1-based, so position 11 means after 10 chars
  IF decoded_text LIKE 'SALT2024::%' THEN
    json_text := trim(substring(decoded_text from 11));
  ELSE
    RAISE EXCEPTION 'Invalid format: SALT2024:: prefix not found in: %', substring(decoded_text from 1 for 50);
  END IF;
  
  -- Parse JSON
  RETURN json_text::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Decryption failed at parsing JSON: % | Text was: %', SQLERRM, substring(json_text from 1 for 100);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.decrypt_simple(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_simple(text) TO service_role;