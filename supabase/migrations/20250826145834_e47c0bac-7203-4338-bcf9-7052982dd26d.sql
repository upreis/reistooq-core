-- Create a safe RPC to read historico_vendas with masking and RLS bypass via SECURITY DEFINER
-- It returns only safe columns listed in the frontend (HISTORICO_SAFE_COLUMNS)

-- Function: public.get_historico_vendas_safe
CREATE OR REPLACE FUNCTION public.get_historico_vendas_safe(
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0,
  _search text DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  id_unico text,
  numero_pedido text,
  sku_produto text,
  descricao text,
  quantidade integer,
  valor_unitario numeric,
  valor_total numeric,
  status text,
  observacoes text,
  data_pedido date,
  created_at timestamptz,
  updated_at timestamptz,
  ncm text,
  codigo_barras text,
  pedido_id text,
  valor_frete numeric,
  data_prevista date,
  obs text,
  obs_interna text,
  cidade text,
  uf text,
  url_rastreamento text,
  situacao text,
  codigo_rastreamento text,
  numero_ecommerce text,
  valor_desconto numeric,
  numero_venda text,
  sku_estoque text,
  sku_kit text,
  qtd_kit integer,
  total_itens integer,
  empresa text,
  integration_account_id uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public AS
$$
  SELECT
    hv.id,
    hv.id_unico,
    hv.numero_pedido,
    hv.sku_produto,
    hv.descricao,
    hv.quantidade,
    hv.valor_unitario,
    hv.valor_total,
    hv.status,
    hv.observacoes,
    hv.data_pedido,
    hv.created_at,
    hv.updated_at,
    hv.ncm,
    hv.codigo_barras,
    hv.pedido_id,
    hv.valor_frete,
    hv.data_prevista,
    hv.obs,
    hv.obs_interna,
    hv.cidade,
    hv.uf,
    hv.url_rastreamento,
    hv.situacao,
    hv.codigo_rastreamento,
    hv.numero_ecommerce,
    hv.valor_desconto,
    hv.numero_venda,
    hv.sku_estoque,
    hv.sku_kit,
    hv.qtd_kit,
    hv.total_itens,
    hv.empresa,
    hv.integration_account_id
  FROM public.historico_vendas hv
  WHERE
    (COALESCE(_search, '') = '' OR (
      hv.sku_produto ILIKE '%' || _search || '%' OR
      hv.numero_pedido ILIKE '%' || _search || '%' OR
      hv.descricao ILIKE '%' || _search || '%'
    ))
    AND (_start IS NULL OR hv.data_pedido >= _start)
    AND (_end IS NULL OR hv.data_pedido <= _end)
    AND (_status IS NULL OR hv.status = _status)
  ORDER BY hv.created_at DESC
  LIMIT COALESCE(_limit, 50)
  OFFSET COALESCE(_offset, 0);
$$;

-- Ensure execution permission for web roles
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_safe(integer, integer, text, date, date, text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_historico_vendas_safe(integer, integer, text, date, date, text)
IS 'Safe reader for historico_vendas returning only non-sensitive columns, with optional filters and pagination.';