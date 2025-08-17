-- 1. Ativar RLS e limpar SELECTs permissivos
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  EXECUTE (
    SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.profiles;', policyname), ' ')
    FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
  );
END$$;

-- 2. Policies corretas
-- Dono vê seu próprio registro
CREATE POLICY profiles_select_self
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- (Opcional) atualização apenas do próprio registro
CREATE POLICY profiles_update_self
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Service role pode tudo (para rotinas do backend)
CREATE POLICY profiles_service_all
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Privilégios: remover PUBLIC; manter roles necessárias
REVOKE ALL ON public.profiles FROM PUBLIC;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 4. View segura NÃO pública
REVOKE ALL ON public.profiles_safe FROM PUBLIC;
GRANT SELECT ON public.profiles_safe TO authenticated;
ALTER VIEW public.profiles_safe SET (security_invoker = true, security_barrier = true);