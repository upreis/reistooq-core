-- 🔚 Kill switch: nenhuma leitura direta nas TABELAS

BEGIN;

-- 0) RLS ligado
ALTER TABLE IF EXISTS public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.historico_vendas ENABLE ROW LEVEL SECURITY;

-- 1) Revogar QUALQUER SELECT nas tabelas (de todos os roles)
REVOKE SELECT ON public.profiles         FROM authenticated, anon, PUBLIC, service_role;
REVOKE SELECT ON public.historico_vendas FROM authenticated, anon, PUBLIC, service_role;

-- 2) Remover policies de SELECT que restarem nas tabelas
DO $$
DECLARE pol record;
BEGIN
  -- profiles: manter nenhuma policy de SELECT (vamos ler só via RPC)
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles;', pol.policyname);
  END LOOP;

  -- historico_vendas: idem (nenhum SELECT direto)
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='historico_vendas' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.historico_vendas;', pol.policyname);
  END LOOP;
END $$;

-- 3) Manter apenas o que for preciso para operar (sem SELECT)
REVOKE ALL ON public.profiles         FROM PUBLIC, anon;
REVOKE ALL ON public.historico_vendas FROM PUBLIC, anon;

GRANT INSERT, UPDATE ON public.profiles TO authenticated;
-- service_role só I/U/D (sem SELECT) em historico_vendas, se você usar import/manutenção:
GRANT INSERT, UPDATE, DELETE ON public.historico_vendas TO service_role;

-- 4) Garantir que as leituras acontecem **só via RPC** (já criadas):
--     get_my_profile(), get_historico_vendas_masked(), admin_list_profiles()

-- 5) Hardening extra (opcional, mas ajuda a tirar warns):
-- fixar search_path de todas as SECURITY DEFINER "soltas"
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT (p.oid::regprocedure)::text rp
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE p.prosecdef AND n.nspname='public'
      AND (p.proconfig IS NULL OR NOT EXISTS (
           SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public;', f.rp);
  END LOOP;
END $$;

COMMIT;