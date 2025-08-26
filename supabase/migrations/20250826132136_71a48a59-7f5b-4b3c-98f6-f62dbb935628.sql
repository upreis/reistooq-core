-- Criar função RPC segura para histórico de vendas com permissões adequadas
CREATE OR REPLACE FUNCTION public.get_historico_vendas_with_permissions(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL,
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
SET search_path = 'public'
AS $$
  -- Verificar se usuário tem permissão para ver histórico
  SELECT CASE 
    WHEN public.has_permission('historico:view') OR public.has_permission('vendas:read') THEN
      (SELECT * FROM public.get_historico_vendas_masked(_start, _end, _search, _limit, _offset))
    ELSE 
      (SELECT NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::integer, 
              NULL::numeric, NULL::numeric, NULL::text, NULL::text, NULL::text, NULL::text, 
              NULL::date, NULL::timestamp with time zone, NULL::timestamp with time zone, 
              NULL::text, NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::date, 
              NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, 
              NULL::text, NULL::text, NULL::numeric, NULL::text, NULL::text, NULL::text, 
              NULL::integer, NULL::integer
       LIMIT 0)
  END;
$$;

-- Atualizar a função get_historico_vendas_masked para usar verificação de permissões
CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL,
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
SET search_path = 'public'
AS $$
  WITH org AS (
    SELECT public.get_current_org_id() AS org_id
  ), base AS (
    SELECT hv.*
    FROM public.historico_vendas hv
    JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
    CROSS JOIN org
    WHERE ia.organization_id = org.org_id
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
    LIMIT COALESCE(_limit, 100) OFFSET COALESCE(_offset, 0)
  )
  SELECT 
    base.id,
    base.id_unico,
    base.numero_pedido,
    base.sku_produto,
    base.descricao,
    base.quantidade,
    base.valor_unitario,
    base.valor_total,
    CASE WHEN public.has_permission('vendas:view_pii') THEN base.cliente_nome ELSE public.mask_name(base.cliente_nome) END AS cliente_nome,
    CASE WHEN public.has_permission('vendas:view_pii') THEN base.cliente_documento ELSE public.mask_document(base.cliente_documento) END AS cliente_documento,
    base.status,
    base.observacoes,
    base.data_pedido,
    base.created_at,
    base.updated_at,
    base.ncm,
    base.codigo_barras,
    base.pedido_id,
    CASE WHEN public.has_permission('vendas:view_pii') THEN base.cpf_cnpj ELSE public.mask_document(base.cpf_cnpj) END AS cpf_cnpj,
    base.valor_frete,
    base.data_prevista,
    base.obs,
    base.obs_interna,
    base.cidade,
    base.uf,
    base.url_rastreamento,
    base.situacao,
    base.codigo_rastreamento,
    base.numero_ecommerce,
    base.valor_desconto,
    base.numero_venda,
    base.sku_estoque,
    base.sku_kit,
    base.qtd_kit,
    base.total_itens
  FROM base;
$$;