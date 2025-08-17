-- CORRIGIR profiles_safe e historico_vendas_safe (RLS + Grants + Verificação)

-- 1) PROFILES_SAFE — sem acesso público e herdando RLS do invocador
REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;
GRANT  SELECT ON public.profiles_safe TO authenticated;
ALTER VIEW public.profiles_safe
  SET (security_invoker = true, security_barrier = true);

-- 2) HISTORICO_VENDAS — RLS por organização (tabela base)
ALTER TABLE public.historico_vendas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  EXECUTE (
    SELECT coalesce(string_agg(format('DROP POLICY IF EXISTS %I ON public.historico_vendas;', policyname),' '), '')
    FROM pg_policies WHERE schemaname='public' AND tablename='historico_vendas'
  );
END $$;

-- Política: usuário autenticado só enxerga vendas de sua organização
CREATE POLICY hv_select_by_org ON public.historico_vendas
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.integration_accounts ia
    JOIN public.profiles p ON p.organizacao_id = ia.organization_id
    WHERE ia.id = historico_vendas.integration_account_id
      AND p.id = auth.uid()
  )
);

-- Se quiser bloquear qualquer outro comando direto:
CREATE POLICY hv_block_other_cmds ON public.historico_vendas
FOR ALL TO authenticated
USING (true) WITH CHECK (false);

-- 3) HISTORICO_VENDAS_SAFE — sem acesso público e herdando RLS
REVOKE ALL ON public.historico_vendas_safe FROM PUBLIC, anon;
GRANT  SELECT ON public.historico_vendas_safe TO authenticated;
ALTER VIEW public.historico_vendas_safe
  SET (security_invoker = true, security_barrier = true);

-- 4) Blindar privilégios futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC;