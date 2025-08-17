-- SECURITY HOTFIX: profiles e profiles_safe
-- 1) RLS e policies corretas em public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Limpa policies antigas (se existirem)
  EXECUTE (
    SELECT coalesce(string_agg(format('DROP POLICY IF EXISTS %I ON public.profiles;', policyname), ' '), '')
    FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
  );
END $$;

-- Dono vê/edita somente o próprio registro
CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Backend (service role) pode tudo
CREATE POLICY profiles_service_all ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2) Remover acesso público e do role 'anon'
REVOKE ALL ON public.profiles FROM PUBLIC, anon;
GRANT  SELECT, UPDATE ON public.profiles TO authenticated;
GRANT  ALL            ON public.profiles TO service_role;

-- 3) Garantir view segura não pública e com invocador
--    (reaplicar grants SEMPRE que a view for recriada)
REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;
GRANT  SELECT ON public.profiles_safe TO authenticated;
ALTER VIEW public.profiles_safe SET (security_invoker = true, security_barrier = true);

-- 4) Blindar privilégios futuros (default privileges do owner da migration)
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC;

-- 5) Warnings: search_path e extensão fora de public
ALTER FUNCTION public.encrypt_integration_secret(uuid,text,text,text,text,text,timestamptz,jsonb,text)
  SET search_path = public;
ALTER FUNCTION public.decrypt_integration_secret(uuid,text,text)
  SET search_path = public;
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION IF EXISTS pgcrypto SET SCHEMA extensions;