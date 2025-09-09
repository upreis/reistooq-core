-- Adicionar coluna token_status para rastreamento de estados (Sistema Blindado)
ALTER TABLE integration_accounts 
ADD COLUMN IF NOT EXISTS token_status TEXT DEFAULT 'unknown';

-- Atualizar status baseado no estado atual dos tokens
UPDATE integration_accounts 
SET token_status = CASE
  WHEN EXISTS (
    SELECT 1 FROM integration_secrets s 
    WHERE s.integration_account_id = integration_accounts.id 
    AND s.provider = integration_accounts.provider
    AND (s.access_token IS NOT NULL OR s.refresh_token IS NOT NULL)
    AND (s.expires_at IS NULL OR s.expires_at > now() + interval '5 minutes')
  ) THEN 'active'
  WHEN EXISTS (
    SELECT 1 FROM integration_secrets s 
    WHERE s.integration_account_id = integration_accounts.id 
    AND s.provider = integration_accounts.provider
    AND s.expires_at IS NOT NULL 
    AND s.expires_at BETWEEN now() AND now() + interval '10 minutes'
  ) THEN 'refresh_needed'
  WHEN EXISTS (
    SELECT 1 FROM integration_secrets s 
    WHERE s.integration_account_id = integration_accounts.id 
    AND s.provider = integration_accounts.provider
    AND s.expires_at IS NOT NULL 
    AND s.expires_at < now()
  ) THEN 'expired'
  WHEN EXISTS (
    SELECT 1 FROM integration_secrets s 
    WHERE s.integration_account_id = integration_accounts.id 
    AND s.provider = integration_accounts.provider
    AND s.secret_enc IS NOT NULL
  ) THEN 'reconnect_required'
  ELSE 'unknown'
END
WHERE provider = 'mercadolivre';

-- Comentário para documentar o sistema
COMMENT ON COLUMN integration_accounts.token_status IS 'Estados do Sistema Blindado: active, refresh_needed, expired, reconnect_required, unknown';