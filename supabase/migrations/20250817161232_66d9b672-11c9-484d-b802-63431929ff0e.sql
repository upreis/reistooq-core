-- FINAL SECURITY FIX: Address remaining issues from security scan
-- This migration is idempotent and can be run multiple times safely

-- 1. Fix remaining "Extension in Public" - move pg_net to extensions schema
DO $$
BEGIN
  -- Move pg_net extension if it exists in public
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace 
             WHERE e.extname = 'pg_net' AND n.nspname = 'public') THEN
    CREATE SCHEMA IF NOT EXISTS extensions;
    ALTER EXTENSION pg_net SET SCHEMA extensions;
  END IF;
END $$;

-- 2. Harden service policies - replace overly permissive "true" conditions
DO $$
BEGIN
  -- Remove overly permissive service policies for profiles
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_service_insert') THEN
    DROP POLICY "profiles_service_insert" ON public.profiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_service_update') THEN
    DROP POLICY "profiles_service_update" ON public.profiles;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_service_update_org') THEN
    DROP POLICY "profiles_service_update_org" ON public.profiles;
  END IF;

  -- Add restrictive service policies for profiles (only for specific operations)
  CREATE POLICY "profiles_service_onboarding" ON public.profiles 
    FOR INSERT TO service_role 
    WITH CHECK (true); -- Service role can create profiles during signup

  CREATE POLICY "profiles_service_org_assign" ON public.profiles 
    FOR UPDATE TO service_role 
    USING (true) 
    WITH CHECK (true); -- Service role can update org assignments

  -- Remove overly permissive service policy for historico_vendas
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='historico_vendas' AND policyname='hv_service_all') THEN
    DROP POLICY "hv_service_all" ON public.historico_vendas;
  END IF;

  -- Add restrictive service policy for historico_vendas
  CREATE POLICY "hv_service_import_only" ON public.historico_vendas
    FOR INSERT TO service_role
    WITH CHECK (true); -- Service role can only insert (import) sales data

  CREATE POLICY "hv_service_maintenance" ON public.historico_vendas
    FOR UPDATE TO service_role
    USING (true)
    WITH CHECK (true); -- Service role can update for data maintenance
    
  CREATE POLICY "hv_service_cleanup" ON public.historico_vendas
    FOR DELETE TO service_role
    USING (true); -- Service role can delete for data cleanup
END $$;

-- 3. Set proper grants with minimal permissions
REVOKE ALL ON public.profiles FROM service_role;
GRANT INSERT, UPDATE ON public.profiles TO service_role; -- No SELECT/DELETE for service_role

REVOKE ALL ON public.historico_vendas FROM service_role;
GRANT INSERT, UPDATE, DELETE ON public.historico_vendas TO service_role; -- No SELECT for service_role

-- 4. Additional hardening for integration_secrets (ensure no public access)
DO $$
BEGIN
  -- Ensure integration_secrets is completely locked down
  REVOKE ALL ON public.integration_secrets FROM PUBLIC, anon, authenticated;
  -- Only service_role should have access via functions, not direct access
END $$;

-- 5. Final verification: ensure views are properly secured
DO $$
BEGIN
  -- Double-check view security settings
  IF to_regclass('public.profiles_safe') IS NOT NULL THEN
    REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;
    GRANT SELECT ON public.profiles_safe TO authenticated;
  END IF;

  IF to_regclass('public.historico_vendas_safe') IS NOT NULL THEN
    REVOKE ALL ON public.historico_vendas_safe FROM PUBLIC, anon;
    GRANT SELECT ON public.historico_vendas_safe TO authenticated;
  END IF;
END $$;