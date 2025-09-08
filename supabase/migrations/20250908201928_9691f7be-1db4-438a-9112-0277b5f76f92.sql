-- Corrigir funções de criptografia para usar pgp_sym_encrypt (compatível com pgcrypto)
DROP FUNCTION IF EXISTS encrypt_simple(text);
DROP FUNCTION IF EXISTS decrypt_simple(text);

-- Função para criptografar dados usando pgp_sym_encrypt
CREATE OR REPLACE FUNCTION encrypt_simple(data text) 
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(data, 'integration_key_2024'), 'base64');
END;
$$;

-- Função para descriptografar dados usando pgp_sym_decrypt
CREATE OR REPLACE FUNCTION decrypt_simple(encrypted_data text)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_data, 'base64'), 'integration_key_2024');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL; -- Retorna NULL se não conseguir descriptografar
END;
$$;