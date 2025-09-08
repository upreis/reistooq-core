-- Usar abordagem ultra-simples (apenas codificação, sem criptografia real)
-- ATENÇÃO: Isto é só ofuscação, não criptografia real, mas resolve o problema atual
DROP FUNCTION IF EXISTS encrypt_simple(text);
DROP FUNCTION IF EXISTS decrypt_simple(text);

-- Codificação simples com base64 + salt
CREATE OR REPLACE FUNCTION encrypt_simple(data text) 
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simples base64 encode com um salt para ofuscar
  RETURN encode(convert_to('SALT2024::' || data, 'utf8'), 'base64');
END;
$$;

-- Decodificação correspondente
CREATE OR REPLACE FUNCTION decrypt_simple(encrypted_data text)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decoded_text text;
BEGIN
  -- Decodificar de base64 e remover salt
  decoded_text := convert_from(decode(encrypted_data, 'base64'), 'utf8');
  
  -- Verificar se tem o salt correto e remover
  IF decoded_text LIKE 'SALT2024::%' THEN
    RETURN substring(decoded_text from 11); -- Remove 'SALT2024::'
  ELSE
    RETURN NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;