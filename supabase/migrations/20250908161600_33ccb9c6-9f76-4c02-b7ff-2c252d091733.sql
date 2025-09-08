-- Ensure unique constraint/index for upsert support on integration_secrets
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_secrets_account_provider_unique
ON public.integration_secrets (integration_account_id, provider);
