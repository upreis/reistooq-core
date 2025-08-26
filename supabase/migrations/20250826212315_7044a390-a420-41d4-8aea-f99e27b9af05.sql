-- Simplificar get_historico_vendas_masked removendo JOIN complexo com pedidos
-- Agora depende apenas do integration_account_id já presente em historico_vendas

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
  data_pedido date,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  sku_produto text,
  descricao text,
  quantidade integer,
  valor_unitario numeric,
  valor_total numeric,
  cliente_nome text,
  cliente_documento text,
  cpf_cnpj text,
  cidade text,
  uf text,
  valor_frete numeric,
  valor_desconto numeric,
  sku_estoque text,
  sku_kit text,
  qtd_kit integer,
  total_itens integer,
  codigo_rastreamento text,
  url_rastreamento text,
  observacoes text,
  ncm text,
  codigo_barras text,
  pedido_id text,
  situacao text,
  numero_ecommerce text,
  numero_venda text,
  data_prevista date,
  obs text,
  obs_interna text,
  -- Novas colunas da imagem
  nome_completo text,
  titulo_produto text,
  valor_pago numeric,
  metodo_pagamento text,
  status_pagamento text,
  data_pagamento timestamp with time zone,
  valor_taxa numeric,
  valor_liquido numeric,
  comissao_ml numeric,
  status_mapeamento text,
  status_baixa text,
  data_baixa timestamp with time zone,
  usuario_baixa text,
  motivo_pendencia text,
  status_envio text,
  transportadora text,
  tipo_entrega text,
  prazo_entrega text,
  data_envio timestamp with time zone,
  data_entrega_prevista timestamp with time zone,
  data_entrega_real timestamp with time zone,
  endereco_entrega text,
  cep_entrega text,
  telefone_cliente text,
  email_cliente text,
  origem_venda text,
  canal_venda text,
  vendedor_responsavel text
) 
LANGUAGE SQL 
STABLE SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 
    hv.id,
    hv.id_unico,
    hv.numero_pedido,
    hv.data_pedido,
    hv.status,
    hv.created_at,
    hv.updated_at,
    hv.sku_produto,
    hv.descricao,
    hv.quantidade,
    hv.valor_unitario,
    hv.valor_total,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cliente_nome ELSE public.mask_name(hv.cliente_nome) END,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cliente_documento ELSE public.mask_document(hv.cliente_documento) END,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cpf_cnpj ELSE public.mask_document(hv.cpf_cnpj) END,
    hv.cidade,
    hv.uf,
    hv.valor_frete,
    hv.valor_desconto,
    hv.sku_estoque,
    hv.sku_kit,
    hv.qtd_kit,
    hv.total_itens,
    hv.codigo_rastreamento,
    hv.url_rastreamento,
    hv.observacoes,
    hv.ncm,
    hv.codigo_barras,
    hv.pedido_id,
    hv.situacao,
    hv.numero_ecommerce,
    hv.numero_venda,
    hv.data_prevista,
    hv.obs,
    hv.obs_interna,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.nome_completo ELSE public.mask_name(hv.nome_completo) END,
    hv.titulo_produto,
    hv.valor_pago,
    hv.metodo_pagamento,
    hv.status_pagamento,
    hv.data_pagamento,
    hv.valor_taxa,
    hv.valor_liquido,
    hv.comissao_ml,
    hv.status_mapeamento,
    hv.status_baixa,
    hv.data_baixa,
    hv.usuario_baixa,
    hv.motivo_pendencia,
    hv.status_envio,
    hv.transportadora,
    hv.tipo_entrega,
    hv.prazo_entrega,
    hv.data_envio,
    hv.data_entrega_prevista,
    hv.data_entrega_real,
    hv.endereco_entrega,
    hv.cep_entrega,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.telefone_cliente ELSE public.mask_phone_secure(hv.telefone_cliente) END,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.email_cliente ELSE public.mask_email(hv.email_cliente) END,
    hv.origem_venda,
    hv.canal_venda,
    hv.vendedor_responsavel
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