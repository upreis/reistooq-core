-- Simplificação das tabelas para estrutura mais limpa

-- Limpar estados OAuth antigos 
DELETE FROM oauth_states WHERE created_at < now() - interval '1 hour';

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_integration_accounts_provider_active 
ON integration_accounts(provider, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_integration_secrets_account_provider 
ON integration_secrets(integration_account_id, provider);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state_provider 
ON oauth_states(state_value, provider, used) WHERE used = false;

-- Comentários para documentar o novo fluxo simplificado
COMMENT ON TABLE integration_accounts IS 'Contas de integração - uma função ml-auth centralizada';
COMMENT ON TABLE integration_secrets IS 'Tokens em texto plano - apenas service role acessa';
COMMENT ON TABLE oauth_states IS 'Estados OAuth temporários - 15min de vida';

-- Garantir que temos constraint de unicidade por provider+account
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_provider_account_identifier'
  ) THEN
    ALTER TABLE integration_accounts 
    ADD CONSTRAINT unique_provider_account_identifier 
    UNIQUE (provider, account_identifier);
  END IF;
END $$;