-- ROLLBACK SCRIPT for DB Hardening Migration
-- Execute this script to revert the security changes if needed

-- PART A: Revert Profiles Security
DROP VIEW IF EXISTS public.profiles_safe CASCADE;
DROP FUNCTION IF EXISTS public.mask_phone(text);

-- Re-enable public access to profiles (if needed)
GRANT SELECT ON TABLE public.profiles TO authenticated;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- PART B: Revert Integration Secrets Security  
DROP FUNCTION IF EXISTS public.encrypt_integration_secret(uuid, text, text, text, text, text, timestamptz, jsonb, text);
DROP FUNCTION IF EXISTS public.decrypt_integration_secret(uuid, text, text);

-- Remove encryption column
ALTER TABLE public.integration_secrets DROP COLUMN IF EXISTS secret_enc;

-- Re-enable direct access (if needed for debugging)
ALTER TABLE public.integration_secrets DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "intsec_block_clients" ON public.integration_secrets;
GRANT SELECT ON TABLE public.integration_secrets TO authenticated;

-- PART C: Revert Historico Vendas (if needed)
-- Note: Keep the existing RLS since get_historico_vendas_masked already exists
-- DROP POLICY IF EXISTS "hv_block_select" ON public.historico_vendas;

COMMENT ON SCHEMA public IS 'Rollback completed - security hardening reverted';