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
    EXECUTE 'CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked(
        _start date DEFAULT NULL,
        _end date DEFAULT NULL,
        _search text DEFAULT NULL,
        _limit integer DEFAULT 100,
        _offset integer DEFAULT 0
      )
      RETURNS TABLE (
        id uuid, id_unico text, numero_pedido text, sku_produto text, descricao text,
        quantidade integer, valor_unitario numeric, valor_total numeric,
        cliente_nome text, cliente_documento text, status text, observacoes text,
        data_pedido date, created_at timestamptz, updated_at timestamptz,
        ncm text, codigo_barras text, pedido_id text, cpf_cnpj text,
        valor_frete numeric, data_prevista date, obs text, obs_interna text,
        cidade text, uf text, url_rastreamento text, situacao text, codigo_rastreamento text,
        numero_ecommerce text, valor_desconto numeric, numero_venda text,
        sku_estoque text, sku_kit text, qtd_kit integer, total_itens integer
      )
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public, pg_catalog
      AS $func$
        WITH org AS (
          SELECT public.get_current_org_id() AS org_id
        ), base AS (
          SELECT hv.*
          FROM public.historico_vendas hv
          JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
          CROSS JOIN org
          WHERE ia.organization_id = org.org_id
            AND (_start IS NULL OR hv.data_pedido >= _start)
            AND (_end IS NULL OR hv.data_pedido <= _end)
            AND (
              _search IS NULL OR _search = '''' OR
              hv.numero_pedido ILIKE ''%'' || _search || ''%'' OR
              hv.sku_produto ILIKE ''%'' || _search || ''%'' OR
              hv.descricao ILIKE ''%'' || _search || ''%''
            )
          ORDER BY hv.data_pedido DESC, hv.created_at DESC
          LIMIT COALESCE(_limit, 100) OFFSET COALESCE(_offset, 0)
        )
        SELECT 
          b.id,
          b.id_unico,
          b.numero_pedido,
          b.sku_produto,
          b.descricao,
          b.quantidade,
          b.valor_unitario,
          b.valor_total,
          CASE WHEN public.has_permission(''vendas:view_pii'') THEN b.cliente_nome ELSE public.mask_name(b.cliente_nome) END AS cliente_nome,
          CASE WHEN public.has_permission(''vendas:view_pii'') THEN b.cliente_documento ELSE public.mask_document(b.cliente_documento) END AS cliente_documento,
          b.status,
          b.observacoes,
          b.data_pedido,
          b.created_at,
          b.updated_at,
          b.ncm,
          b.codigo_barras,
          b.pedido_id,
          CASE WHEN public.has_permission(''vendas:view_pii'') THEN b.cpf_cnpj ELSE public.mask_document(b.cpf_cnpj) END AS cpf_cnpj,
          b.valor_frete,
          b.data_prevista,
          b.obs,
          b.obs_interna,
          b.cidade,
          b.uf,
          b.url_rastreamento,
          b.situacao,
          b.codigo_rastreamento,
          b.numero_ecommerce,
          b.valor_desconto,
          b.numero_venda,
          b.sku_estoque,
          b.sku_kit,
          b.qtd_kit,
          b.total_itens
        FROM base b;
      $func$;';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.get_historico_vendas_masked(date, date, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_masked(date, date, text, integer, integer) TO authenticated;

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