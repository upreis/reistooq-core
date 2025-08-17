-- 🔒 PROFILES: remover acesso amplo do service_role e manter só "self" para authenticated
BEGIN;

-- 0) Garantir RLS ativo
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 1) Remover policies perigosas citadas pelo scanner
DROP POLICY IF EXISTS "profiles_service_onboarding"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_org_assign"  ON public.profiles;

-- 2) Remover QUALQUER policy que ainda inclua service_role
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename='profiles'
      AND 'service_role' = ANY(roles)
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles;', pol.policyname);
  END LOOP;
END $$;

-- 3) Não deixar grants diretos para service_role
REVOKE ALL ON public.profiles FROM service_role, PUBLIC, anon;

-- 4) Deixar só as policies mínimas para usuários logados (self-only).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select_self'
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_select_self" ON public.profiles
             FOR SELECT TO authenticated USING (id = auth.uid())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_update_self'
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_update_self" ON public.profiles
             FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_insert_self'
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_insert_self" ON public.profiles
             FOR INSERT TO authenticated WITH CHECK (id = auth.uid())';
  END IF;
END $$;

-- 5) Grants mínimos (sem SELECT amplo; RLS decide o resto)
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

COMMIT;