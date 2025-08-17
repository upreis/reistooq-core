-- SECURITY HARDENING: Comprehensive security fix for all issues
-- This migration is idempotent and can be run multiple times safely

-- 1. REVOKE/GRANT em views sensíveis
DO $$
BEGIN
  IF to_regclass('public.profiles_safe') IS NOT NULL THEN
    REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;
    GRANT  SELECT ON public.profiles_safe TO authenticated;
    EXECUTE 'ALTER VIEW public.profiles_safe SET (security_invoker = true, security_barrier = true)';
  END IF;

  IF to_regclass('public.historico_vendas_safe') IS NOT NULL THEN
    REVOKE ALL ON public.historico_vendas_safe FROM PUBLIC, anon;
    GRANT  SELECT ON public.historico_vendas_safe TO authenticated;
    EXECUTE 'ALTER VIEW public.historico_vendas_safe SET (security_invoker = true, security_barrier = true)';
  END IF;
END $$;

-- 2. RLS em tabelas base (profiles, historico_vendas)
ALTER TABLE IF EXISTS public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.historico_vendas  ENABLE ROW LEVEL SECURITY;

-- 2.1 PERFIS: políticas mínimas e seguras
DO $$
BEGIN
  -- Remove dangerous service_all policy if exists
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_service_all') THEN
    EXECUTE 'DROP POLICY "profiles_service_all" ON public.profiles';
  END IF;

  -- Add safe policies if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select_self') THEN
    EXECUTE 'CREATE POLICY "profiles_select_self" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_update_self') THEN
    EXECUTE 'CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_insert_self') THEN
    EXECUTE 'CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid())';
  END IF;

  -- Admin por organização
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='has_permission') 
     AND EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='get_current_org_id')
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_admin_select_org') THEN
    EXECUTE 'CREATE POLICY "profiles_admin_select_org" ON public.profiles FOR SELECT TO authenticated USING (organizacao_id = public.get_current_org_id() AND public.has_permission(''users:read''))';
  END IF;
END $$;

-- Grants mínimos para profiles
REVOKE ALL ON public.profiles FROM PUBLIC, anon;
GRANT  INSERT, UPDATE ON public.profiles TO authenticated;
GRANT  ALL            ON public.profiles TO service_role;

-- 2.2 HISTÓRICO DE VENDAS: política por organização
DO $$
DECLARE 
  pol_record record;
BEGIN
  -- Limpa políticas antigas conflitantes
  FOR pol_record IN (SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='historico_vendas') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.historico_vendas', pol_record.policyname);
  END LOOP;

  -- SELECT por organização (autenticados)
  EXECUTE 'CREATE POLICY hv_select_by_org ON public.historico_vendas FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.integration_accounts ia WHERE ia.id = historico_vendas.integration_account_id AND ia.organization_id = public.get_current_org_id()))';

  -- Bloquear INSERT/UPDATE/DELETE para authenticated
  EXECUTE 'CREATE POLICY hv_block_iud ON public.historico_vendas FOR ALL TO authenticated USING (false) WITH CHECK (false)';

  -- Permitir service_role para operações administrativas  
  EXECUTE 'CREATE POLICY hv_service_all ON public.historico_vendas FOR ALL TO service_role USING (true) WITH CHECK (true)';
END $$;

REVOKE ALL ON public.historico_vendas FROM PUBLIC, anon;
GRANT  SELECT ON public.historico_vendas TO authenticated;
GRANT  ALL    ON public.historico_vendas TO service_role;

-- 3. Recriar profiles_safe com filtro por organização
DO $$
BEGIN
  IF to_regclass('public.profiles_safe') IS NOT NULL THEN
    DROP VIEW public.profiles_safe;
    
    CREATE VIEW public.profiles_safe
    WITH (security_invoker = true, security_barrier = true) AS
    SELECT 
      p.id,
      p.nome_completo,
      p.nome_exibicao,
      CASE WHEN EXISTS (SELECT 1 FROM pg_proc pr JOIN pg_namespace nn ON nn.oid=pr.pronamespace 
                        WHERE nn.nspname='public' AND pr.proname='mask_phone')
           THEN public.mask_phone(p.telefone) ELSE p.telefone END AS telefone,
      p.cargo,
      p.departamento,
      p.organizacao_id,
      p.avatar_url,
      p.created_at,
      p.updated_at,
      p.onboarding_banner_dismissed,
      p.configuracoes_notificacao
    FROM public.profiles p
    WHERE (p.organizacao_id = COALESCE((SELECT public.get_current_org_id()), p.organizacao_id))
       OR (p.id = auth.uid());

    REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;
    GRANT  SELECT ON public.profiles_safe TO authenticated;
  END IF;
END $$;

-- 4. Recriar historico_vendas_safe usando função segura existente  
DO $$
BEGIN
  IF to_regclass('public.historico_vendas_safe') IS NOT NULL THEN
    DROP VIEW public.historico_vendas_safe;
    
    -- Usar função segura se existir
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace 
               WHERE n.nspname='public' AND p.proname='get_historico_vendas_masked') THEN
      CREATE VIEW public.historico_vendas_safe
      WITH (security_invoker = true, security_barrier = true) AS
      SELECT * FROM public.get_historico_vendas_masked();
    ELSE
      -- Fallback: criar view básica com organização
      CREATE VIEW public.historico_vendas_safe  
      WITH (security_invoker = true, security_barrier = true) AS
      SELECT
        hv.id, hv.id_unico, hv.numero_pedido, hv.sku_produto, hv.descricao,
        hv.quantidade, hv.valor_unitario, hv.valor_total,
        hv.status, hv.observacoes, hv.data_pedido, hv.created_at, hv.updated_at,
        hv.ncm, hv.codigo_barras, hv.pedido_id,
        hv.valor_frete, hv.data_prevista, hv.obs, hv.obs_interna,
        hv.cidade, hv.uf, hv.url_rastreamento, hv.situacao, hv.codigo_rastreamento,
        hv.numero_ecommerce, hv.valor_desconto, hv.numero_venda,
        hv.sku_estoque, hv.sku_kit, hv.qtd_kit, hv.total_itens
      FROM public.historico_vendas hv
      JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
      WHERE ia.organization_id = public.get_current_org_id();
    END IF;

    REVOKE ALL ON public.historico_vendas_safe FROM PUBLIC, anon;
    GRANT  SELECT ON public.historico_vendas_safe TO authenticated;
  END IF;
END $$;

-- 5. Blindar privilégios futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon;

-- 6. Corrigir "Function Search Path Mutable"
DO $$
DECLARE func_record record;
BEGIN
  FOR func_record IN
    SELECT (p.oid::regprocedure)::text AS rp
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef
      AND n.nspname = 'public'
      AND (p.proconfig IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'
          ))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public;', func_record.rp);
  END LOOP;
END $$;

-- 7. Corrigir "Extension in Public"
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
DECLARE ext_record record;
BEGIN
  FOR ext_record IN
    SELECT e.extname
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE n.nspname = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions;', ext_record.extname);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Nao foi possivel mover a extensao: %', ext_record.extname;
    END;
  END LOOP;
END $$;