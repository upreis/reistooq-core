-- Corrigir funções adicionando SET search_path para segurança
DROP FUNCTION IF EXISTS encrypt_simple(text);
DROP FUNCTION IF EXISTS decrypt_simple(text);

-- Função para criptografar dados de integração (com search_path seguro)
CREATE OR REPLACE FUNCTION encrypt_simple(data text) 
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(encrypt(data::bytea, 'integration_key_2024', 'aes'), 'base64');
END;
$$;

-- Função para descriptografar dados de integração (com search_path seguro)
CREATE OR REPLACE FUNCTION decrypt_simple(encrypted_data text)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), 'integration_key_2024', 'aes'), 'UTF8');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL; -- Retorna NULL se não conseguir descriptografar
END;
$$;