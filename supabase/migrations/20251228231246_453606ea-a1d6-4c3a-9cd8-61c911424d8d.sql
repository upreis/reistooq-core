CREATE OR REPLACE FUNCTION public.hv_insert(p_data jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
  v_inserted_id uuid;
BEGIN
  INSERT INTO public.historico_vendas (
    id_unico, numero_pedido, sku_produto, quantidade, valor_unitario, valor_total,
    data_pedido, status,
    cliente_nome, cliente_documento, nome_completo, cpf_cnpj, email, telefone,
    empresa,
    endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep,
    rua, numero, bairro, cidade, uf, cep,
    titulo_produto, descricao, codigo_barras, ncm, observacoes,
    origem, numero_ecommerce, numero_venda, situacao,
    metodo_pagamento, status_pagamento, tipo_pagamento,
    valor_frete, valor_desconto, valor_liquido_vendedor, taxa_marketplace,
    desconto_cupom, custo_envio_seller, valor_pago, frete_pago_cliente,
    receita_flex_bonus, custo_fixo_meli,
    data_prevista, codigo_rastreamento, url_rastreamento, status_envio,
    shipping_method, shipping_mode, shipping_substatus, delivery_type,
    tipo_entrega, metodo_envio_combinado, modo_envio_combinado,
    tipo_metodo_envio, tipo_logistico, logistic_type, logistic_mode_principal,
    substatus_estado_atual, substatus_detail, status_baixa, status_mapeamento,
    conditions, status_insumos,
    local_estoque, local_estoque_id, local_estoque_nome,
    local_venda_id, local_venda_nome,
    sku_kit, sku_pedido, sku_estoque, sku_kit_mapeado, sku_original,
    quantidade_total,
    integration_account_id, organization_id, created_by
  )
  VALUES (
    COALESCE(p_data->>'id_unico', gen_random_uuid()::text),
    p_data->>'numero_pedido',
    p_data->>'sku_produto',
    NULLIF(p_data->>'quantidade','')::integer,
    NULLIF(p_data->>'valor_unitario','')::numeric,
    NULLIF(p_data->>'valor_total','')::numeric,
    NULLIF(p_data->>'data_pedido','')::timestamptz,
    p_data->>'status',

    p_data->>'cliente_nome',
    p_data->>'cliente_documento',
    p_data->>'nome_completo',
    p_data->>'cpf_cnpj',
    p_data->>'email',
    p_data->>'telefone',

    p_data->>'empresa',

    p_data->>'endereco_rua',
    p_data->>'endereco_numero',
    p_data->>'endereco_bairro',
    p_data->>'endereco_cidade',
    p_data->>'endereco_uf',
    p_data->>'endereco_cep',
    p_data->>'rua',
    p_data->>'numero',
    p_data->>'bairro',
    p_data->>'cidade',
    p_data->>'uf',
    p_data->>'cep',

    p_data->>'titulo_produto',
    p_data->>'descricao',
    p_data->>'codigo_barras',
    p_data->>'ncm',
    p_data->>'observacoes',

    p_data->>'origem',
    p_data->>'numero_ecommerce',
    p_data->>'numero_venda',
    p_data->>'situacao',

    p_data->>'metodo_pagamento',
    p_data->>'status_pagamento',
    p_data->>'tipo_pagamento',
    NULLIF(p_data->>'valor_frete','')::numeric,
    NULLIF(p_data->>'valor_desconto','')::numeric,
    NULLIF(p_data->>'valor_liquido_vendedor','')::numeric,
    NULLIF(p_data->>'taxa_marketplace','')::numeric,
    NULLIF(p_data->>'desconto_cupom','')::numeric,
    NULLIF(p_data->>'custo_envio_seller','')::numeric,
    NULLIF(p_data->>'valor_pago','')::numeric,
    NULLIF(p_data->>'frete_pago_cliente','')::numeric,
    NULLIF(p_data->>'receita_flex_bonus','')::numeric,
    NULLIF(p_data->>'custo_fixo_meli','')::numeric,

    NULLIF(p_data->>'data_prevista','')::timestamptz,
    p_data->>'codigo_rastreamento',
    p_data->>'url_rastreamento',
    p_data->>'status_envio',
    p_data->>'shipping_method',
    p_data->>'shipping_mode',
    p_data->>'shipping_substatus',
    p_data->>'delivery_type',
    p_data->>'tipo_entrega',
    p_data->>'metodo_envio_combinado',
    p_data->>'modo_envio_combinado',
    p_data->>'tipo_metodo_envio',
    p_data->>'tipo_logistico',
    p_data->>'logistic_type',
    p_data->>'logistic_mode_principal',

    p_data->>'substatus_estado_atual',
    p_data->>'substatus_detail',
    p_data->>'status_baixa',
    p_data->>'status_mapeamento',
    p_data->>'conditions',
    p_data->>'status_insumos',

    p_data->>'local_estoque',
    NULLIF(p_data->>'local_estoque_id','')::uuid,
    p_data->>'local_estoque_nome',
    NULLIF(p_data->>'local_venda_id','')::uuid,
    p_data->>'local_venda_nome',

    p_data->>'sku_kit',
    p_data->>'sku_pedido',
    p_data->>'sku_estoque',
    p_data->>'sku_kit_mapeado',
    p_data->>'sku_original',
    NULLIF(p_data->>'quantidade_total','')::integer,

    NULLIF(p_data->>'integration_account_id', '')::uuid,
    NULLIF(p_data->>'organization_id','')::uuid,
    NULLIF(p_data->>'created_by','')::uuid
  )
  RETURNING id INTO v_inserted_id;

  v_result := json_build_object(
    'success', true,
    'id', v_inserted_id,
    'message', 'Registro inserido com sucesso'
  );

  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'duplicate',
      'message', 'Registro já existe no histórico'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro ao inserir registro'
    );
END;
$$;