-- Limpeza: remove RPCs antigos que não são mais necessários
-- Agora usamos acesso direto à tabela integration_secrets com RLS

-- Remove funções de encrypt/decrypt que não são mais usadas
DROP FUNCTION IF EXISTS public.encrypt_integration_secret(uuid,text,text,jsonb,timestamptz,jsonb);
DROP FUNCTION IF EXISTS public.encrypt_integration_secret(uuid,text,text,text,text,text,timestamptz,jsonb,text);
DROP FUNCTION IF EXISTS public.decrypt_integration_secret(text,text,text);
DROP FUNCTION IF EXISTS public.decrypt_integration_secret(uuid,text,text);

-- Adiciona comentário indicando a nova abordagem
COMMENT ON TABLE public.integration_secrets IS 'Secrets stored in plain text, protected by RLS. Only service-role can access.';

-- Confirma que as colunas necessárias existem para a nova abordagem
ALTER TABLE public.integration_secrets
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS refresh_token text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;

-- Índice para melhor performance nas consultas diretas
CREATE INDEX IF NOT EXISTS idx_integration_secrets_account_provider_lookup
  ON public.integration_secrets (integration_account_id, provider)
  WHERE access_token IS NOT NULL;