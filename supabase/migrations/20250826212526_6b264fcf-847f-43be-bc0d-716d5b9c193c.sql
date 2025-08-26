-- Simplificar get_historico_vendas_masked usando apenas colunas existentes
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(_start date, _end date, _search text, _limit integer, _offset integer);

CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked(
  _start date DEFAULT NULL::date, 
  _end date DEFAULT NULL::date, 
  _search text DEFAULT NULL::text, 
  _limit integer DEFAULT 100, 
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  id_unico text,
  numero_pedido text,
  sku_produto text,
  descricao text,
  quantidade integer,
  valor_unitario numeric,
  valor_total numeric,
  cliente_nome text,
  cliente_documento text,
  status text,
  observacoes text,
  data_pedido date,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  ncm text,
  codigo_barras text,
  pedido_id text,
  cpf_cnpj text,
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
  total_itens integer
) 
LANGUAGE SQL 
STABLE SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 
    hv.id,
    hv.id_unico,
    hv.numero_pedido,
    hv.sku_produto,
    hv.descricao,
    hv.quantidade,
    hv.valor_unitario,
    hv.valor_total,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cliente_nome ELSE public.mask_name(hv.cliente_nome) END,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cliente_documento ELSE public.mask_document(hv.cliente_documento) END,
    hv.status,
    hv.observacoes,
    hv.data_pedido,
    hv.created_at,
    hv.updated_at,
    hv.ncm,
    hv.codigo_barras,
    hv.pedido_id,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cpf_cnpj ELSE public.mask_document(hv.cpf_cnpj) END,
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
    hv.total_itens
  FROM public.historico_vendas hv
  JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
  WHERE ia.organization_id = public.get_current_org_id()
    AND (public.has_permission('historico:view') OR public.has_permission('vendas:read'))
    AND (_start IS NULL OR hv.data_pedido >= _start)
    AND (_end IS NULL OR hv.data_pedido <= _end)
    AND (
      _search IS NULL OR _search = '' OR
      hv.numero_pedido ILIKE '%' || _search || '%' OR
      hv.sku_produto ILIKE '%' || _search || '%' OR
      hv.descricao ILIKE '%' || _search || '%'
    )
  ORDER BY hv.data_pedido DESC, hv.created_at DESC
  LIMIT COALESCE(_limit, 100) OFFSET COALESCE(_offset, 0);
$$;