-- ✅ Remover acesso de service_role em dados de clientes (historico_vendas)
BEGIN;

ALTER TABLE IF EXISTS public.historico_vendas ENABLE ROW LEVEL SECURITY;

-- 1) Tire QUALQUER privilégio do service_role e de roles públicos
REVOKE ALL ON public.historico_vendas FROM service_role, authenticated, PUBLIC, anon;

-- 2) Apague policies que ainda citem service_role (qualquer comando)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename='historico_vendas'
      AND 'service_role' = ANY(roles)
  LOOP
    EXECUTE format('DROP POLICY %I ON public.historico_vendas;', pol.policyname);
  END LOOP;
END $$;

-- 3) Garanta um "nega tudo" para usuários normais (leitura só via RPC)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='historico_vendas' AND policyname='hv_deny_all_auth'
  ) THEN
    EXECUTE 'CREATE POLICY hv_deny_all_auth ON public.historico_vendas
             FOR ALL TO authenticated USING (false) WITH CHECK (false)';
  END IF;
END $$;

COMMIT;