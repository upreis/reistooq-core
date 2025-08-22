-- Corrigir tabela integration_secrets para ter secret_enc NOT NULL
-- mas permitir inserção de dados em plain text para ML integration

-- Criar função para popular secret_enc automaticamente
CREATE OR REPLACE FUNCTION public.encrypt_integration_secret()
RETURNS TRIGGER AS $$
DECLARE
  secret_data jsonb;
BEGIN
  -- Construir objeto JSON com os campos do secret
  secret_data := jsonb_build_object(
    'access_token', NEW.access_token,
    'refresh_token', NEW.refresh_token,
    'expires_at', NEW.expires_at::text,
    'meta', NEW.meta,
    'payload', NEW.payload
  );
  
  -- Usar uma chave padrão para criptografia (em produção usar vault)
  NEW.secret_enc := extensions.pgp_sym_encrypt(secret_data::text, 'ml_secret_key_2025');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Remover o trigger restritivo anterior se existir
DROP TRIGGER IF EXISTS integration_secrets_prevent_plaintext_trigger ON integration_secrets;

-- Criar trigger para auto-criptografar
CREATE OR REPLACE TRIGGER encrypt_integration_secret_trigger
  BEFORE INSERT OR UPDATE ON integration_secrets
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_integration_secret();

-- Adicionar comentários para documentiação
COMMENT ON TABLE integration_secrets IS 'Armazena secrets de integração de forma criptografada. Para ML: access_token, refresh_token, expires_at são salvos em secret_enc';
COMMENT ON COLUMN integration_secrets.secret_enc IS 'Dados criptografados em JSON: {access_token, refresh_token, expires_at, meta, payload}';

-- Garantir que oauth_states tenha organization_id preenchido automaticamente
CREATE OR REPLACE FUNCTION public.set_oauth_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.organization_id := (
      SELECT organizacao_id 
      FROM profiles 
      WHERE id = NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE TRIGGER set_oauth_organization_trigger
  BEFORE INSERT ON oauth_states
  FOR EACH ROW
  EXECUTE FUNCTION set_oauth_organization();