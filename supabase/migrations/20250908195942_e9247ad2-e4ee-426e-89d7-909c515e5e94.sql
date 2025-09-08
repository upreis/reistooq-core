-- Criar funções de criptografia simples usando PostgreSQL nativo
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para criptografar dados de integração
CREATE OR REPLACE FUNCTION encrypt_simple(data text) 
RETURNS text AS $$
BEGIN
  RETURN encode(encrypt(data::bytea, 'integration_key_2024', 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para descriptografar dados de integração  
CREATE OR REPLACE FUNCTION decrypt_simple(encrypted_data text)
RETURNS text AS $$
BEGIN
  RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), 'integration_key_2024', 'aes'), 'UTF8');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL; -- Retorna NULL se não conseguir descriptografar
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar colunas para nova estrutura simples
ALTER TABLE integration_secrets 
ADD COLUMN IF NOT EXISTS simple_tokens text,
ADD COLUMN IF NOT EXISTS use_simple boolean DEFAULT false;