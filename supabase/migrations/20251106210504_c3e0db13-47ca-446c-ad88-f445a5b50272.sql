-- Criar a função atualizada que retorna todos os 95 campos
CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid, id_unico text, numero_pedido text, numero_ecommerce text, numero_venda text,
  numero text, pedido_id text, pack_id text, pickup_id text, sku_produto text,
  sku_estoque text, sku_kit text, skus_produtos text, descricao text, titulo_produto text,
  titulo_anuncio text, codigo_barras text, ncm text, quantidade integer, quantidade_total integer,
  quantidade_itens integer, quantidade_kit integer, qtd_kit integer, total_itens integer,
  valor_unitario numeric, valor_total numeric, valor_pago numeric, valor_frete numeric,
  frete_pago_cliente numeric, valor_desconto numeric, desconto_cupom numeric, taxa_marketplace numeric,
  valor_liquido_vendedor numeric, custo_envio_seller numeric, receita_flex_bonus numeric,
  custo_fixo_meli numeric, cliente_nome text, cliente_documento text, nome_completo text,
  cpf_cnpj text, cidade text, uf text, bairro text, rua text, cep text, status text,
  situacao text, status_envio text, status_baixa text, status_mapeamento text, status_insumos text,
  status_pagamento text, substatus_estado_atual text, substatus_detail text, pack_status text,
  pack_status_detail text, shipping_substatus text, shipping_shipping_status text, conditions text,
  data_pedido date, data_prevista date, date_created timestamptz, last_updated timestamptz,
  ultima_atualizacao timestamptz, created_at timestamptz, updated_at timestamptz,
  codigo_rastreamento text, url_rastreamento text, logistic_mode_principal text, tipo_logistico text,
  logistic_type text, tipo_metodo_envio text, tipo_entrega text, metodo_envio_combinado text,
  modo_envio_combinado text, delivery_type text, shipping_method text, shipping_mode text,
  metodo_pagamento text, tipo_pagamento text, empresa text, origem text, marketplace_origem text,
  integration_account_id uuid, local_estoque text, local_estoque_id uuid, local_estoque_nome text,
  observacoes text, obs text, obs_interna text, tags text[], meta jsonb, raw jsonb,
  raw_data jsonb, created_by uuid, level_id text, power_seller_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  WITH org AS (SELECT public.get_current_org_id() AS org_id),
  base AS (
    SELECT hv.* FROM public.historico_vendas hv
    JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
    CROSS JOIN org
    WHERE ia.organization_id = org.org_id
      AND (_start IS NULL OR hv.data_pedido >= _start)
      AND (_end IS NULL OR hv.data_pedido <= _end)
      AND (_search IS NULL OR _search = '' OR hv.numero_pedido ILIKE '%' || _search || '%' OR hv.sku_produto ILIKE '%' || _search || '%' OR hv.descricao ILIKE '%' || _search || '%')
    ORDER BY hv.data_pedido DESC, hv.created_at DESC
    LIMIT COALESCE(_limit, 100) OFFSET COALESCE(_offset, 0)
  )
  SELECT b.id, b.id_unico, b.numero_pedido, b.numero_ecommerce, b.numero_venda, b.numero, b.pedido_id, b.pack_id, b.pickup_id, b.sku_produto, b.sku_estoque, b.sku_kit, b.skus_produtos, b.descricao, b.titulo_produto, b.titulo_anuncio, b.codigo_barras, b.ncm, b.quantidade, b.quantidade_total, b.quantidade_itens, b.quantidade_kit, b.qtd_kit, b.total_itens, b.valor_unitario, b.valor_total, b.valor_pago, b.valor_frete, b.frete_pago_cliente, b.valor_desconto, b.desconto_cupom, b.taxa_marketplace, b.valor_liquido_vendedor, b.custo_envio_seller, b.receita_flex_bonus, b.custo_fixo_meli,
    CASE WHEN public.has_permission('vendas:view_pii') THEN b.cliente_nome ELSE public.mask_name(b.cliente_nome) END AS cliente_nome,
    CASE WHEN public.has_permission('vendas:view_pii') THEN b.cliente_documento ELSE public.mask_document(b.cliente_documento) END AS cliente_documento,
    CASE WHEN public.has_permission('vendas:view_pii') THEN b.nome_completo ELSE public.mask_name(b.nome_completo) END AS nome_completo,
    CASE WHEN public.has_permission('vendas:view_pii') THEN b.cpf_cnpj ELSE public.mask_document(b.cpf_cnpj) END AS cpf_cnpj,
    b.cidade, b.uf, b.bairro, b.rua, b.cep, b.status, b.situacao, b.status_envio, b.status_baixa, b.status_mapeamento, b.status_insumos, b.status_pagamento, b.substatus_estado_atual, b.substatus_detail, b.pack_status, b.pack_status_detail, b.shipping_substatus, b.shipping_shipping_status, b.conditions, b.data_pedido, b.data_prevista, b.date_created, b.last_updated, b.ultima_atualizacao, b.created_at, b.updated_at, b.codigo_rastreamento, b.url_rastreamento, b.logistic_mode_principal, b.tipo_logistico, b.logistic_type, b.tipo_metodo_envio, b.tipo_entrega, b.metodo_envio_combinado, b.modo_envio_combinado, b.delivery_type, b.shipping_method, b.shipping_mode, b.metodo_pagamento, b.tipo_pagamento, b.empresa, b.origem, b.marketplace_origem, b.integration_account_id, b.local_estoque, b.local_estoque_id, b.local_estoque_nome, b.observacoes, b.obs, b.obs_interna, b.tags, b.meta, b.raw, b.raw_data, b.created_by, b.level_id, b.power_seller_status
  FROM base b;
$$;