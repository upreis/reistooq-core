-- Fix 2 critical security issues: profiles org-wide access and direct historico_vendas reading

-- =========================
-- 1) PROFILES: só "self"
-- =========================

-- remova qualquer policy que permita leitura org-wide
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='profiles' 
      AND policyname='profiles_admin_select_org'
  ) THEN
    EXECUTE 'DROP POLICY "profiles_admin_select_org" ON public.profiles';
  END IF;
END $$;

-- mantenha apenas a policy de "ver o próprio perfil"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='profiles' 
      AND policyname='profiles_select_self'
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_select_self" ON public.profiles
             FOR SELECT TO authenticated
             USING (id = auth.uid())';
  END IF;
END $$;

-- garanta RLS ligado e privilégios mínimos
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM PUBLIC, anon;
-- ⚠ Mantemos SELECT para authenticated, mas RLS limita a "self"
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- =========================
-- 2) HISTORICO_VENDAS: 
--     nenhuma leitura direta na TABELA
--     leitura só via VIEW segura
-- =========================

-- remova a policy de leitura por organização na TABELA
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='historico_vendas' 
      AND policyname='hv_select_by_org'
  ) THEN
    EXECUTE 'DROP POLICY "hv_select_by_org" ON public.historico_vendas';
  END IF;
END $$;

-- bloqueie SELECT para usuários autenticados na TABELA
REVOKE SELECT ON public.historico_vendas FROM authenticated;
REVOKE ALL    ON public.historico_vendas FROM PUBLIC, anon;

-- mantenha apenas políticas para manutenção pelo service_role (I/U/D)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='historico_vendas' 
      AND policyname='hv_service_import_only'
  ) THEN
    EXECUTE 'CREATE POLICY "hv_service_import_only" ON public.historico_vendas
             FOR INSERT TO service_role WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='historico_vendas' 
      AND policyname='hv_service_maintenance'
  ) THEN
    EXECUTE 'CREATE POLICY "hv_service_maintenance" ON public.historico_vendas
             FOR UPDATE TO service_role USING (true) WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='historico_vendas' 
      AND policyname='hv_service_cleanup'
  ) THEN
    EXECUTE 'CREATE POLICY "hv_service_cleanup" ON public.historico_vendas
             FOR DELETE TO service_role USING (true)';
  END IF;
END $$;

ALTER TABLE IF EXISTS public.historico_vendas ENABLE ROW LEVEL SECURITY;

-- =========================
-- 3) Views seguras continuam sendo o "gateway" de leitura
-- =========================

-- profiles_safe
DO $$
BEGIN
  IF to_regclass('public.profiles_safe') IS NOT NULL THEN
    REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;
    GRANT  SELECT ON public.profiles_safe TO authenticated;
    EXECUTE 'ALTER VIEW public.profiles_safe 
             SET (security_invoker = true, security_barrier = true)';
  END IF;
END $$;

-- historico_vendas_safe
DO $$
BEGIN
  IF to_regclass('public.historico_vendas_safe') IS NOT NULL THEN
    REVOKE ALL ON public.historico_vendas_safe FROM PUBLIC, anon;
    GRANT  SELECT ON public.historico_vendas_safe TO authenticated;
    EXECUTE 'ALTER VIEW public.historico_vendas_safe 
             SET (security_invoker = true, security_barrier = true)';
  END IF;
END $$;