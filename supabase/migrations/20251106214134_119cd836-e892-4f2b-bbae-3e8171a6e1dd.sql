-- Dropar e recriar get_historico_vendas_browse com campos de local_estoque
DROP FUNCTION IF EXISTS public.get_historico_vendas_browse(integer, integer, text, date, date);

CREATE FUNCTION public.get_historico_vendas_browse(
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0,
  _search text DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL
)
RETURNS TABLE (
  -- Campos básicos
  id uuid, id_unico text, numero_pedido text, numero_ecommerce text, numero_venda text, numero text,
  pedido_id text, pack_id text, pickup_id text,
  
  -- Produtos
  sku_produto text, sku_estoque text, sku_kit text, skus_produtos text,
  descricao text, titulo_produto text, codigo_barras text, ncm text,
  
  -- Quantidades
  quantidade integer, quantidade_total integer, quantidade_itens integer, 
  quantidade_kit integer, qtd_kit integer, total_itens integer,
  
  -- Valores
  valor_unitario numeric, valor_total numeric, valor_pago numeric,
  valor_frete numeric, frete_pago_cliente numeric, valor_desconto numeric,
  desconto_cupom numeric, taxa_marketplace numeric, valor_liquido_vendedor numeric,
  custo_envio_seller numeric, receita_flex_bonus numeric,
  
  -- Cliente (mascarado)
  cliente_nome text, cliente_documento text, nome_completo text, cpf_cnpj text,
  
  -- Endereço
  cidade text, uf text, bairro text, rua text, cep text,
  
  -- Status
  status text, situacao text, status_envio text, status_baixa text, status_mapeamento text,
  status_pagamento text, substatus_estado_atual text, substatus_detail text,
  pack_status text, pack_status_detail text,
  
  -- Datas
  data_pedido date, data_prevista date, date_created timestamptz,
  last_updated timestamptz, ultima_atualizacao timestamptz,
  created_at timestamptz, updated_at timestamptz,
  
  -- Rastreamento e envio
  codigo_rastreamento text, url_rastreamento text,
  logistic_mode_principal text, tipo_logistico text, tipo_metodo_envio text,
  tipo_entrega text, metodo_envio_combinado text, modo_envio_combinado text,
  delivery_type text, shipping_method text, shipping_mode text,
  
  -- Pagamento
  metodo_pagamento text, tipo_pagamento text,
  
  -- Origem
  empresa text, integration_account_id uuid,
  
  -- 🆕 LOCAL DE ESTOQUE (NOVOS CAMPOS)
  local_estoque text, local_estoque_id uuid, local_estoque_nome text,
  
  -- Observações
  observacoes text, obs text, obs_interna text,
  
  -- Tags e metadata
  tags text[], meta jsonb,
  
  -- Auditoria
  created_by uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  WITH org AS (
    SELECT public.get_current_org_id() AS org_id
  )
  SELECT 
    hv.id, hv.id_unico, hv.numero_pedido, hv.numero_ecommerce, hv.numero_venda, hv.numero,
    hv.pedido_id, hv.pack_id, hv.pickup_id,
    hv.sku_produto, hv.sku_estoque, hv.sku_kit, hv.skus_produtos,
    hv.descricao, hv.titulo_produto, hv.codigo_barras, hv.ncm,
    hv.quantidade, hv.quantidade_total, hv.quantidade_itens,
    hv.quantidade_kit, hv.qtd_kit, hv.total_itens,
    hv.valor_unitario, hv.valor_total, hv.valor_pago,
    hv.valor_frete, hv.frete_pago_cliente, hv.valor_desconto,
    hv.desconto_cupom, hv.taxa_marketplace, hv.valor_liquido_vendedor,
    hv.custo_envio_seller, hv.receita_flex_bonus,
    -- Mascara PII se usuário não tem permissão
    CASE WHEN public.has_permission('vendas:view_pii') 
      THEN hv.cliente_nome 
      ELSE public.mask_name(hv.cliente_nome) 
    END AS cliente_nome,
    CASE WHEN public.has_permission('vendas:view_pii') 
      THEN hv.cliente_documento 
      ELSE public.mask_document(hv.cliente_documento) 
    END AS cliente_documento,
    CASE WHEN public.has_permission('vendas:view_pii') 
      THEN hv.nome_completo 
      ELSE public.mask_name(hv.nome_completo) 
    END AS nome_completo,
    CASE WHEN public.has_permission('vendas:view_pii') 
      THEN hv.cpf_cnpj 
      ELSE public.mask_document(hv.cpf_cnpj) 
    END AS cpf_cnpj,
    hv.cidade, hv.uf, hv.bairro, hv.rua, hv.cep,
    hv.status, hv.situacao, hv.status_envio, hv.status_baixa, hv.status_mapeamento,
    hv.status_pagamento, hv.substatus_estado_atual, hv.substatus_detail,
    hv.pack_status, hv.pack_status_detail,
    hv.data_pedido, hv.data_prevista, hv.date_created,
    hv.last_updated, hv.ultima_atualizacao,
    hv.created_at, hv.updated_at,
    hv.codigo_rastreamento, hv.url_rastreamento,
    hv.logistic_mode_principal, hv.tipo_logistico, hv.tipo_metodo_envio,
    hv.tipo_entrega, hv.metodo_envio_combinado, hv.modo_envio_combinado,
    hv.delivery_type, hv.shipping_method, hv.shipping_mode,
    hv.metodo_pagamento, hv.tipo_pagamento,
    hv.empresa, hv.integration_account_id,
    -- 🆕 Retornar campos de local de estoque
    hv.local_estoque, hv.local_estoque_id, hv.local_estoque_nome,
    hv.observacoes, hv.obs, hv.obs_interna,
    hv.tags, hv.meta,
    hv.created_by
  FROM public.historico_vendas hv
  JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
  CROSS JOIN org
  WHERE ia.organization_id = org.org_id
    AND (_start IS NULL OR hv.data_pedido >= _start)
    AND (_end IS NULL OR hv.data_pedido <= _end)
    AND (_search IS NULL OR _search = '' 
      OR hv.numero_pedido ILIKE '%' || _search || '%'
      OR hv.sku_produto ILIKE '%' || _search || '%'
      OR hv.descricao ILIKE '%' || _search || '%')
  ORDER BY hv.data_pedido DESC, hv.created_at DESC
  LIMIT COALESCE(_limit, 20)
  OFFSET COALESCE(_offset, 0);
$$;

COMMENT ON FUNCTION public.get_historico_vendas_browse IS 'Função para listagem de histórico de vendas com suporte a paginação, busca e mascaramento de PII. Inclui campos de local_estoque';

GRANT EXECUTE ON FUNCTION public.get_historico_vendas_browse(integer, integer, text, date, date) TO authenticated;