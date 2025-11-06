-- 🚨 CORREÇÃO CRÍTICA: Adicionar local_estoque_id, local_estoque_nome e local_estoque ao RPC hv_insert
-- O RPC não estava inserindo estas colunas, causando perda de dados críticos para reversão de estoque

DROP FUNCTION IF EXISTS public.hv_insert(jsonb);

CREATE OR REPLACE FUNCTION public.hv_insert(p_data jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result json;
BEGIN
  INSERT INTO public.historico_vendas (
    id_unico, numero_pedido, sku_produto, quantidade, valor_unitario, valor_total,
    data_pedido, status, cliente_nome, cliente_documento, nome_completo, cpf_cnpj,
    email, telefone, empresa, endereco_rua, endereco_numero, endereco_bairro,
    endereco_cidade, endereco_uf, endereco_cep, titulo_produto, descricao,
    codigo_barras, ncm, observacoes, origem, numero_ecommerce, numero_venda,
    situacao, metodo_pagamento, status_pagamento, tipo_pagamento, valor_frete,
    valor_desconto, data_prevista, codigo_rastreamento, url_rastreamento,
    status_envio, shipping_method, shipping_mode, delivery_type, tipo_entrega,
    metodo_envio_combinado, modo_envio_combinado, tipo_metodo_envio,
    tipo_logistico, logistic_mode_principal, substatus_estado_atual,
    substatus_detail, status_baixa, status_mapeamento, sku_kit, sku_estoque,
    quantidade_kit, qtd_kit, quantidade_itens, quantidade_total, total_itens,
    valor_liquido_vendedor, taxa_marketplace, desconto_cupom, custo_envio_seller,
    valor_pago, frete_pago_cliente, receita_flex_bonus, pack_id, pickup_id,
    pack_status, pack_status_detail, obs, obs_interna, tags, skus_produtos,
    -- ✅ CRÍTICO: Adicionar colunas de local de estoque
    local_estoque_id, local_estoque_nome, local_estoque,
    -- Colunas adicionais da fotografia 3.1 (se existirem)
    rua, numero, bairro, cep, cidade, uf, shipping_substatus, 
    logistic_type, titulo_anuncio, conditions, status_insumos, custo_fixo_meli,
    marketplace_origem, date_created, last_updated, power_seller_status, level_id,
    raw_data,
    meta, raw, integration_account_id, created_by
  ) VALUES (
    p_data->>'id_unico', p_data->>'numero_pedido', p_data->>'sku_produto',
    COALESCE((p_data->>'quantidade')::integer, 0),
    COALESCE((p_data->>'valor_unitario')::numeric, 0),
    COALESCE((p_data->>'valor_total')::numeric, 0),
    COALESCE((p_data->>'data_pedido')::date, CURRENT_DATE),
    COALESCE(p_data->>'status', 'concluida'),
    p_data->>'cliente_nome', p_data->>'cliente_documento', p_data->>'nome_completo',
    p_data->>'cpf_cnpj', p_data->>'email', p_data->>'telefone', p_data->>'empresa',
    p_data->>'endereco_rua', p_data->>'endereco_numero', p_data->>'endereco_bairro',
    p_data->>'endereco_cidade', p_data->>'endereco_uf', p_data->>'endereco_cep',
    p_data->>'titulo_produto', p_data->>'descricao', p_data->>'codigo_barras',
    p_data->>'ncm', p_data->>'observacoes', p_data->>'origem',
    p_data->>'numero_ecommerce', p_data->>'numero_venda', p_data->>'situacao',
    p_data->>'metodo_pagamento', p_data->>'status_pagamento', p_data->>'tipo_pagamento',
    COALESCE((p_data->>'valor_frete')::numeric, 0),
    COALESCE((p_data->>'valor_desconto')::numeric, 0),
    (p_data->>'data_prevista')::date, p_data->>'codigo_rastreamento',
    p_data->>'url_rastreamento', p_data->>'status_envio', p_data->>'shipping_method',
    p_data->>'shipping_mode', p_data->>'delivery_type', p_data->>'tipo_entrega',
    p_data->>'metodo_envio_combinado', p_data->>'modo_envio_combinado',
    p_data->>'tipo_metodo_envio', p_data->>'tipo_logistico',
    p_data->>'logistic_mode_principal', p_data->>'substatus_estado_atual',
    p_data->>'substatus_detail', p_data->>'status_baixa', p_data->>'status_mapeamento',
    p_data->>'sku_kit', p_data->>'sku_estoque',
    COALESCE((p_data->>'quantidade_kit')::integer, 0),
    COALESCE((p_data->>'qtd_kit')::integer, 0),
    COALESCE((p_data->>'quantidade_itens')::integer, 0),
    COALESCE((p_data->>'quantidade_total')::integer, 0),
    COALESCE((p_data->>'total_itens')::integer, 0),
    COALESCE((p_data->>'valor_liquido_vendedor')::numeric, 0),
    COALESCE((p_data->>'taxa_marketplace')::numeric, 0),
    COALESCE((p_data->>'desconto_cupom')::numeric, 0),
    COALESCE((p_data->>'custo_envio_seller')::numeric, 0),
    COALESCE((p_data->>'valor_pago')::numeric, 0),
    COALESCE((p_data->>'frete_pago_cliente')::numeric, 0),
    COALESCE((p_data->>'receita_flex_bonus')::numeric, 0),
    p_data->>'pack_id', p_data->>'pickup_id', p_data->>'pack_status',
    p_data->>'pack_status_detail', p_data->>'obs', p_data->>'obs_interna',
    CASE WHEN p_data->'tags' IS NOT NULL THEN 
      ARRAY(SELECT jsonb_array_elements_text(p_data->'tags'))
    ELSE NULL END,
    p_data->>'skus_produtos',
    -- ✅ CRÍTICO: Salvar local de estoque
    COALESCE((p_data->>'local_estoque_id')::uuid, NULL),
    p_data->>'local_estoque_nome',
    p_data->>'local_estoque',
    -- Colunas adicionais
    p_data->>'rua', p_data->>'numero', p_data->>'bairro', p_data->>'cep',
    p_data->>'cidade', p_data->>'uf', p_data->>'shipping_substatus',
    p_data->>'logistic_type', p_data->>'titulo_anuncio', p_data->>'conditions',
    p_data->>'status_insumos', 
    COALESCE((p_data->>'custo_fixo_meli')::numeric, 0),
    p_data->>'marketplace_origem',
    (p_data->>'date_created')::timestamp with time zone,
    (p_data->>'last_updated')::timestamp with time zone,
    p_data->>'power_seller_status', p_data->>'level_id',
    p_data->'raw_data',
    COALESCE(p_data->'meta', '{}'::jsonb),
    p_data->'raw',
    COALESCE((p_data->>'integration_account_id')::uuid, NULL),
    auth.uid()
  );
  
  v_result := json_build_object('success', true, 'message', 'Histórico salvo com sucesso');
  RETURN v_result;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao inserir histórico: %', SQLERRM;
    v_result := json_build_object('success', false, 'error', SQLERRM);
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.hv_insert IS 'Insere fotografia completa no histórico de vendas incluindo local_estoque_id (CRÍTICO para reversão de estoque)';

GRANT EXECUTE ON FUNCTION public.hv_insert(jsonb) TO authenticated;