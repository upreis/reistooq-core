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

-- ========= RPC: histórico seguro =========
-- Use a função que você já tem; senão, o fallback abaixo mascara + filtra por org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='get_historico_vendas_masked'
  ) THEN
    EXECUTE $FN$
      CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked()
      RETURNS TABLE (
        id bigint, id_unico text, numero_pedido text, sku_produto text, descricao text,
        quantidade numeric, valor_unitario numeric, valor_total numeric,
        cliente_nome text, cliente_documento text, status text, observacoes text,
        data_pedido timestamptz, created_at timestamptz, updated_at timestamptz,
        ncm text, codigo_barras text, pedido_id text, cpf_cnpj text,
        valor_frete numeric, data_prevista date, obs text, obs_interna text,
        cidade text, uf text, url_rastreamento text, situacao text, codigo_rastreamento text,
        numero_ecommerce text, valor_desconto numeric, numero_venda text,
        sku_estoque text, sku_kit text, qtd_kit numeric, total_itens numeric
      )
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public, pg_catalog
      AS $$
        SELECT
          hv.id, hv.id_unico, hv.numero_pedido, hv.sku_produto, hv.descricao,
          hv.quantidade, hv.valor_unitario, hv.valor_total,
          COALESCE(public.mask_name(hv.cliente_nome), hv.cliente_nome)           AS cliente_nome,
          COALESCE(public.mask_document(hv.cliente_documento), hv.cliente_documento) AS cliente_documento,
          hv.status, hv.observacoes, hv.data_pedido, hv.created_at, hv.updated_at,
          hv.ncm, hv.codigo_barras, hv.pedido_id,
          COALESCE(public.mask_document(hv.cpf_cnpj), hv.cpf_cnpj)               AS cpf_cnpj,
          hv.valor_frete, hv.data_prevista, hv.obs, hv.obs_interna,
          hv.cidade, hv.uf, hv.url_rastreamento, hv.situacao, hv.codigo_rastreamento,
          hv.numero_ecommerce, hv.valor_desconto, hv.numero_venda,
          hv.sku_estoque, hv.sku_kit, hv.qtd_kit, hv.total_itens
        FROM public.historico_vendas hv
        JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
        WHERE ia.organization_id = public.get_current_org_id();
      $$;
    $FN$;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.get_historico_vendas_masked() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_masked() TO authenticated;

-- Remova leitura direta:
--  - da TABELA historico_vendas (já bloqueada)
--  - e da VIEW historico_vendas_safe (para o scanner parar de implicar)
REVOKE SELECT ON public.historico_vendas_safe FROM authenticated;
REVOKE ALL    ON public.historico_vendas_safe FROM PUBLIC, anon;

-- Hardening extra já que o scanner marca avisos:
-- Fixar search_path em funções SECURITY DEFINER "soltas"
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT (p.oid::regprocedure)::text AS rp
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE p.prosecdef AND n.nspname='public'
      AND (p.proconfig IS NULL OR NOT EXISTS (
           SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public;', f.rp);
  END LOOP;
END $$;

-- Extensões no schema public (se movíveis)
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
DECLARE e record;
BEGIN
  FOR e IN
    SELECT e.extname
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE n.nspname='public' AND e.extname <> 'pg_net' -- pg_net normalmente não pode ser movida
  LOOP
    BEGIN
      EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions;', e.extname);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Não foi possível mover a extensão: %', e.extname;
    END;
  END LOOP;
END $$;