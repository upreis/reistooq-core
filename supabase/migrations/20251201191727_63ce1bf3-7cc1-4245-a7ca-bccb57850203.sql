-- COMBO 2 SIMPLIFICATION - FASE 1
-- Consolidar campos de sync tracking em integration_accounts

-- Adicionar campos de sync tracking em integration_accounts
ALTER TABLE public.integration_accounts
ADD COLUMN IF NOT EXISTS last_claims_sync_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_sync_status text,
ADD COLUMN IF NOT EXISTS last_sync_error text,
ADD COLUMN IF NOT EXISTS claims_fetched integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS claims_cached integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS sync_duration_ms integer;

-- Criar índice para performance em queries de sync
CREATE INDEX IF NOT EXISTS idx_integration_accounts_last_sync 
ON public.integration_accounts(last_claims_sync_at) 
WHERE provider = 'mercadolivre' AND is_active = true;

-- Comentários para documentação
COMMENT ON COLUMN public.integration_accounts.last_claims_sync_at IS 'Última sincronização de claims do Mercado Livre';
COMMENT ON COLUMN public.integration_accounts.last_sync_status IS 'Status da última sincronização (success, error)';
COMMENT ON COLUMN public.integration_accounts.last_sync_error IS 'Mensagem de erro da última sincronização (se houver)';
COMMENT ON COLUMN public.integration_accounts.claims_fetched IS 'Quantidade de claims buscados na última sincronização';
COMMENT ON COLUMN public.integration_accounts.claims_cached IS 'Quantidade de claims armazenados em cache na última sincronização';
COMMENT ON COLUMN public.integration_accounts.sync_duration_ms IS 'Duração da última sincronização em milissegundos';