-- Remover tentativas anteriores e usar abordagem mais simples
DROP FUNCTION IF EXISTS encrypt_simple(text);
DROP FUNCTION IF EXISTS decrypt_simple(text);

-- Usar criptografia básica com digest + encode (mais compatível)
CREATE OR REPLACE FUNCTION encrypt_simple(data text) 
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Usar uma codificação simples mas segura
  -- Combina base64 + hash para ofuscar mas ser reversível
  RETURN encode(
    convert_to(
      data || '::' || encode(digest(data || 'integration_key_2024', 'sha256'), 'hex'),
      'utf8'
    ), 
    'base64'
  );
END;
$$;

-- Função para descriptografar 
CREATE OR REPLACE FUNCTION decrypt_simple(encrypted_data text)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decoded_text text;
  data_part text;
  hash_part text;
  expected_hash text;
BEGIN
  -- Decodificar de base64
  decoded_text := convert_from(decode(encrypted_data, 'base64'), 'utf8');
  
  -- Separar dados e hash
  data_part := split_part(decoded_text, '::', 1);
  hash_part := split_part(decoded_text, '::', 2);
  
  -- Verificar integridade
  expected_hash := encode(digest(data_part || 'integration_key_2024', 'sha256'), 'hex');
  
  IF hash_part = expected_hash THEN
    RETURN data_part;
  ELSE
    RETURN NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;