-- Vamos ver as colunas da função get_historico_vendas_masked 
-- e corrigir as discrepâncias entre os nomes das colunas retornadas e os tipos TypeScript

-- Primero, vamos criar uma versão atualizada da função que retorna os nomes corretos
CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked(_start date DEFAULT NULL::date, _end date DEFAULT NULL::date, _search text DEFAULT NULL::text, _limit integer DEFAULT 100, _offset integer DEFAULT 0)
 RETURNS TABLE(
   -- Campos básicos (obrigatórios)
   id uuid,
   id_unico text,
   empresa text,
   numero_pedido text,
   cliente_nome text, -- Renomeado de nome_cliente
   nome_completo text,
   data_pedido date,
   ultima_atualizacao timestamp with time zone,
   created_at timestamp with time zone,
   updated_at timestamp with time zone,
   
   -- Produtos
   sku_produto text,
   descricao text, -- Campo obrigatório que estava faltando
   quantidade integer, -- Campo obrigatório que estava faltando - mapeado de quantidade_total
   quantidade_total integer,
   titulo_produto text,
   valor_unitario numeric, -- Campo obrigatório que estava faltando
   
   -- Financeiras
   valor_total numeric,
   valor_pago numeric,
   frete_pago_cliente numeric,
   receita_flex_bonus numeric,
   custo_envio_seller numeric,
   desconto_cupom numeric,
   taxa_marketplace numeric,
   valor_liquido_vendedor numeric,
   metodo_pagamento text,
   status_pagamento text,
   tipo_pagamento text,
   
   -- Mapeamento
   status text, -- Campo obrigatório que estava faltando
   status_mapeamento text,
   sku_estoque text,
   sku_kit text,
   quantidade_kit integer,
   total_itens integer,
   status_baixa text,
   
   -- Envio e localização
   status_envio text,
   logistic_mode_principal text,
   tipo_logistico text,
   tipo_metodo_envio text,
   tipo_entrega text,
   substatus_estado_atual text,
   modo_envio_combinado text,
   metodo_envio_combinado text,
   cidade text, -- Campo que estava faltando
   uf text, -- Campo que estava faltando
   
   -- Campos adicionais para compatibilidade
   cliente_documento text,
   observacoes text,
   ncm text,
   codigo_barras text,
   pedido_id text,
   cpf_cnpj text,
   valor_frete numeric,
   data_prevista date,
   obs text,
   obs_interna text,
   url_rastreamento text,
   situacao text,
   codigo_rastreamento text,
   numero_ecommerce text,
   valor_desconto numeric,
   numero_venda text,
   qtd_kit integer,
   integration_account_id uuid
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    -- Básicas (obrigatórias)
    hv.id,
    hv.id_unico,
    hv.empresa,
    hv.numero_pedido,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cliente_nome ELSE public.mask_name(hv.cliente_nome) END as cliente_nome,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.nome_completo ELSE public.mask_name(hv.nome_completo) END as nome_completo,
    hv.data_pedido,
    hv.ultima_atualizacao,
    hv.created_at,
    hv.updated_at,
    
    -- Produtos
    hv.sku_produto,
    COALESCE(hv.descricao, hv.titulo_produto, 'Produto') as descricao, -- Obrigatório
    COALESCE(hv.quantidade, hv.quantidade_total, 1) as quantidade, -- Obrigatório
    hv.quantidade_total,
    hv.titulo_produto,
    COALESCE(hv.valor_unitario, hv.valor_total, 0) as valor_unitario, -- Obrigatório
    
    -- Financeiras
    hv.valor_total,
    hv.valor_pago,
    hv.frete_pago_cliente,
    hv.receita_flex_bonus,
    hv.custo_envio_seller,
    hv.desconto_cupom,
    hv.taxa_marketplace,
    hv.valor_liquido_vendedor,
    hv.metodo_pagamento,
    hv.status_pagamento,
    hv.tipo_pagamento,
    
    -- Mapeamento
    COALESCE(hv.status, hv.status_baixa, 'processado') as status, -- Obrigatório
    hv.status_mapeamento,
    hv.sku_estoque,
    hv.sku_kit,
    hv.quantidade_kit,
    hv.total_itens,
    hv.status_baixa,
    
    -- Envio
    hv.status_envio,
    hv.logistic_mode_principal,
    hv.tipo_logistico,
    hv.tipo_metodo_envio,
    hv.tipo_entrega,
    hv.substatus_estado_atual,
    hv.modo_envio_combinado,
    hv.metodo_envio_combinado,
    hv.cidade, -- Campo que estava faltando
    hv.uf, -- Campo que estava faltando
    
    -- Campos adicionais para compatibilidade
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cliente_documento ELSE public.mask_document(hv.cliente_documento) END as cliente_documento,
    hv.observacoes,
    hv.ncm,
    hv.codigo_barras,
    hv.pedido_id,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cpf_cnpj ELSE public.mask_document(hv.cpf_cnpj) END as cpf_cnpj,
    hv.valor_frete,
    hv.data_prevista,
    hv.obs,
    hv.obs_interna,
    hv.url_rastreamento,
    hv.situacao,
    hv.codigo_rastreamento,
    hv.numero_ecommerce,
    hv.valor_desconto,
    hv.numero_venda,
    hv.qtd_kit,
    hv.integration_account_id
    
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
      hv.titulo_produto ILIKE '%' || _search || '%' OR
      hv.cliente_nome ILIKE '%' || _search || '%'
    )
  ORDER BY hv.data_pedido DESC, hv.created_at DESC
  LIMIT COALESCE(_limit, 100) OFFSET COALESCE(_offset, 0);
$function$