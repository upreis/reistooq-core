-- ROLLBACK SCRIPT - DB Hardening Migration
-- Execute this if you need to revert the security hardening changes

-- PART A: Rollback Profiles security
DROP VIEW IF EXISTS public.profiles_safe CASCADE;
DROP FUNCTION IF EXISTS public.mask_phone(text);

-- Restore public access to profiles
GRANT SELECT ON TABLE public.profiles TO authenticated;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- PART B: Rollback Integration Secrets security
DROP FUNCTION IF EXISTS public.encrypt_integration_secret;
DROP FUNCTION IF EXISTS public.decrypt_integration_secret;

-- Remove encrypted column (CAUTION: this will lose encrypted data!)
-- ALTER TABLE public.integration_secrets DROP COLUMN IF EXISTS secret_enc;

-- Restore access (CAUTION: this exposes secrets!)
DROP POLICY IF EXISTS "intsec_block_clients" ON public.integration_secrets;
ALTER TABLE public.integration_secrets DISABLE ROW LEVEL SECURITY;

-- PART C: Rollback Historico Vendas security  
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;

-- Restore access to base table (use with caution!)
DROP POLICY IF EXISTS "hv_block_select" ON public.historico_vendas;

-- NOTE: The existing get_historico_vendas_masked function provides proper security
-- and should remain in use for normal operations

-- CAUTION: Only run this rollback if absolutely necessary
-- Consider the security implications before executing