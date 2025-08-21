-- Deduplicate and add unique constraint for upsert to work in encrypt_integration_secret
-- 1) Remove duplicates keeping the most recent per (integration_account_id, provider)
WITH ranked AS (
  SELECT id,
         integration_account_id,
         provider,
         created_at,
         updated_at,
         row_number() OVER (
           PARTITION BY integration_account_id, provider
           ORDER BY updated_at DESC, created_at DESC, id DESC
         ) AS rn
  FROM public.integration_secrets
)
DELETE FROM public.integration_secrets s
USING ranked r
WHERE s.id = r.id AND r.rn > 1;

-- 2) Add the unique constraint required by ON CONFLICT (integration_account_id, provider)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'integration_secrets_unique_account_provider'
      AND conrelid = 'public.integration_secrets'::regclass
  ) THEN
    ALTER TABLE public.integration_secrets
    ADD CONSTRAINT integration_secrets_unique_account_provider
    UNIQUE (integration_account_id, provider);
  END IF;
END $$;