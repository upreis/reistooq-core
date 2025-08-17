-- 🔐 Corrigir 2 erros: PROFILES (self-only) e ORGANIZACOES (apenas própria org)
BEGIN;

-----------------------------
-- 1) PROFILES (dados de usuário)
-----------------------------
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover qualquer grant amplo
REVOKE ALL    ON public.profiles FROM PUBLIC, anon, service_role;
-- Vamos permitir SELECT para authenticated, mas o RLS vai filtrar (self-only)
GRANT  SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Apagar policies perigosas (SELECT amplo ou com service_role)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND (cmd='SELECT' OR 'service_role' = ANY(roles))
      AND policyname <> 'profiles_select_self'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles;', pol.policyname);
  END LOOP;
END $$;

-- Garantir políticas mínimas e seguras (idempotentes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select_self'
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_select_self" ON public.profiles
             FOR SELECT TO authenticated
             USING (id = auth.uid())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_update_self'
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_update_self" ON public.profiles
             FOR UPDATE TO authenticated
             USING (id = auth.uid()) WITH CHECK (id = auth.uid())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_insert_self'
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_insert_self" ON public.profiles
             FOR INSERT TO authenticated
             WITH CHECK (id = auth.uid())';
  END IF;
END $$;

-----------------------------
-- 2) ORGANIZACOES (dados da empresa)
-----------------------------
ALTER TABLE IF EXISTS public.organizacoes ENABLE ROW LEVEL SECURITY;

-- Remover grants amplos
REVOKE ALL ON public.organizacoes FROM PUBLIC, anon, service_role;
-- Permitimos SELECT para authenticated; o RLS restringe ao que pode ver
GRANT  SELECT ON public.organizacoes TO authenticated;

-- Apagar policies com service_role ou SELECT amplo
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname='public' AND tablename='organizacoes'
      AND ('service_role' = ANY(roles) OR cmd='SELECT')
      AND policyname NOT IN ('orgs_select_own','orgs_admin_same_org')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.organizacoes;', pol.policyname);
  END LOOP;
END $$;

-- Apenas a própria organização do usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='organizacoes' AND policyname='orgs_select_own'
  ) THEN
    EXECUTE 'CREATE POLICY orgs_select_own ON public.organizacoes
             FOR SELECT TO authenticated
             USING (id = public.get_current_org_id())';
  END IF;

  -- (Opcional) Admins podem ler, mas **somente** a própria org
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='has_permission'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='organizacoes' AND policyname='orgs_admin_same_org'
  ) THEN
    EXECUTE 'CREATE POLICY orgs_admin_same_org ON public.organizacoes
             FOR SELECT TO authenticated
             USING (id = public.get_current_org_id() AND public.has_permission(''orgs:read''))';
  END IF;
END $$;

COMMIT;