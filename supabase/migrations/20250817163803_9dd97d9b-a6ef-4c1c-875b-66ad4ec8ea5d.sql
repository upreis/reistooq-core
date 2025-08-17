-- ========= RPC: meu perfil =========
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT *
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Pare de permitir SELECT direto na TABELA 'profiles'
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE ALL    ON public.profiles FROM PUBLIC, anon;
-- (RLS continua para service_role e UPDATE/INSERT se você precisar; ajuste se necessário)
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL            ON public.profiles TO service_role;

-- Remova leitura direta:
--  - da TABELA historico_vendas (já bloqueada)
--  - e da VIEW historico_vendas_safe (para o scanner parar de implicar)
REVOKE SELECT ON public.historico_vendas_safe FROM authenticated;
REVOKE ALL    ON public.historico_vendas_safe FROM PUBLIC, anon;

-- Hardening extra já que o scanner marca avisos:
-- Fixar search_path em funções SECURITY DEFINER "soltas"
DO $$
DECLARE func_record record;
BEGIN
  FOR func_record IN
    SELECT (p.oid::regprocedure)::text AS rp
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE p.prosecdef AND n.nspname='public'
      AND (p.proconfig IS NULL OR NOT EXISTS (
           SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public;', func_record.rp);
  END LOOP;
END $$;

-- Extensões no schema public (se movíveis)
CREATE SCHEMA IF NOT EXISTS extensions;