-- Security hardening: Block direct table access and secure views
-- 1) Enable RLS on base tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_vendas ENABLE ROW LEVEL SECURITY;

-- profiles: owner sees only their own record
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- historico_vendas: block direct SELECT (consumption via view only)
DO $$
BEGIN
  -- remove any previous permissive SELECT policies
  EXECUTE (
    SELECT COALESCE(string_agg(format('DROP POLICY IF EXISTS %I ON public.historico_vendas;', polname), ' '), '')
    FROM pg_policies
    WHERE schemaname='public' AND tablename='historico_vendas' AND cmd='SELECT'
  );
END$$;

CREATE POLICY hv_block_all_select
ON public.historico_vendas
FOR SELECT
USING (false);

-- 2) Secure views - remove public read access and force security_invoker
REVOKE ALL ON public.profiles_safe FROM PUBLIC;
REVOKE ALL ON public.historico_vendas_safe FROM PUBLIC;

GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- Postgres 15+: views respect caller's RLS (fixes SUPA_security_definer_view)
ALTER VIEW public.profiles_safe SET (security_invoker = true, security_barrier = true);
ALTER VIEW public.historico_vendas_safe SET (security_invoker = true, security_barrier = true);