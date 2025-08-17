-- ROLLBACK SCRIPT for 2025-08-16 Security Hardening
-- ⚠️  WARNING: Execute only if absolutely necessary
-- ⚠️  This will expose sensitive data again

-- INTEGRATION_SECRETS ─────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_intsec_legacy_nullify ON public.integration_secrets;
DROP FUNCTION IF EXISTS public.integration_secrets_legacy_nullify();
DROP FUNCTION IF EXISTS public.encrypt_integration_secret(uuid, text, text, text, text, text, timestamptz, jsonb, text);
DROP FUNCTION IF EXISTS public.decrypt_integration_secret(uuid, text, text);

-- Remove encrypted column (CAUTION: this will lose encrypted data!)
-- ALTER TABLE public.integration_secrets DROP COLUMN IF EXISTS secret_enc;

-- Restore client access (CAUTION: this exposes secrets!)
DROP POLICY IF EXISTS "intsec_block_clients" ON public.integration_secrets;
ALTER TABLE public.integration_secrets DISABLE ROW LEVEL SECURITY;

-- HISTORICO_VENDAS ────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;

-- Restore public access to base table
DROP POLICY IF EXISTS hv_block_select ON public.historico_vendas;
ALTER TABLE public.historico_vendas DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.historico_vendas TO authenticated;

-- PROFILES ─────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.profiles_safe CASCADE;
DROP FUNCTION IF EXISTS public.mask_phone(text);

-- Restore public access to profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.profiles TO authenticated;

-- NOTES:
-- - The existing get_historico_vendas_masked function provides proper security
--   and should remain in use for normal operations
-- - Only run this rollback if absolutely necessary for debugging
-- - Consider the security implications before executing
-- - Re-apply security hardening as soon as possible