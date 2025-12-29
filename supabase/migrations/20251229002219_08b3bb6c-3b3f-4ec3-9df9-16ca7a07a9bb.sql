-- 🔧 CORREÇÃO CRÍTICA: Atualizar hv_insert para usar APENAS colunas que existem na tabela
-- Problema identificado: A função tentava inserir em colunas inexistentes como 'email', 'telefone', 'endereco_*', 'organization_id'

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
    -- Campos obrigatórios
    id_unico, numero_pedido, sku_produto, quantidade, valor_unitario, valor_total,
    data_pedido, status,
    -- Cliente
    cliente_nome, cliente_documento, nome_completo, cpf_cnpj,
    -- Empresa
    empresa,
    -- Endereço (colunas corretas: rua, numero, bairro, cidade, uf, cep)
    rua, numero, bairro, cidade, uf, cep,
    -- Produto
    titulo_produto, titulo_anuncio, descricao, codigo_barras, ncm, observacoes, conditions,
    -- Origem/números
    origem, numero_ecommerce, numero_venda, situacao,
    -- Pagamento
    metodo_pagamento, status_pagamento, tipo_pagamento,
    -- Valores financeiros
    valor_frete, valor_desconto, valor_liquido_vendedor, taxa_marketplace,
    desconto_cupom, custo_envio_seller, valor_pago, frete_pago_cliente,
    receita_flex_bonus, custo_fixo_meli,
    -- Envio/Rastreamento
    data_prevista, codigo_rastreamento, url_rastreamento, status_envio,
    shipping_method, shipping_mode, shipping_substatus, delivery_type,
    tipo_entrega, metodo_envio_combinado, modo_envio_combinado,
    tipo_metodo_envio, tipo_logistico, logistic_type, logistic_mode_principal,
    substatus_estado_atual, substatus_detail, 
    -- Status
    status_baixa, status_mapeamento, status_insumos,
    -- Local de estoque
    local_estoque, local_estoque_id, local_estoque_nome,
    -- Local de venda  
    local_venda_id, local_venda_nome,
    -- SKUs
    sku_kit, sku_estoque, skus_produtos,
    quantidade_total, quantidade_itens, quantidade_kit, qtd_kit, total_itens,
    -- ML específico
    pack_id, pickup_id, pack_status, pack_status_detail, tags,
    power_seller_status, level_id, date_created, marketplace_origem,
    -- Metadados
    integration_account_id, created_by, raw, raw_data, meta, ultima_atualizacao, last_updated
  )
  VALUES (
    -- Campos obrigatórios
    COALESCE(p_data->>'id_unico', gen_random_uuid()::text),
    COALESCE(p_data->>'numero_pedido', 'SEM_NUMERO'),
    COALESCE(p_data->>'sku_produto', 'BAIXA_ESTOQUE'),
    COALESCE(NULLIF(p_data->>'quantidade','')::integer, 1),
    COALESCE(NULLIF(p_data->>'valor_unitario','')::numeric, 0),
    COALESCE(NULLIF(p_data->>'valor_total','')::numeric, 0),
    COALESCE(NULLIF(p_data->>'data_pedido','')::date, CURRENT_DATE),
    COALESCE(p_data->>'status', 'baixado'),
    -- Cliente
    p_data->>'cliente_nome',
    p_data->>'cliente_documento',
    p_data->>'nome_completo',
    p_data->>'cpf_cnpj',
    -- Empresa
    p_data->>'empresa',
    -- Endereço
    p_data->>'rua',
    p_data->>'numero',
    p_data->>'bairro',
    p_data->>'cidade',
    p_data->>'uf',
    p_data->>'cep',
    -- Produto
    p_data->>'titulo_produto',
    p_data->>'titulo_anuncio',
    p_data->>'descricao',
    p_data->>'codigo_barras',
    p_data->>'ncm',
    p_data->>'observacoes',
    p_data->>'conditions',
    -- Origem
    p_data->>'origem',
    p_data->>'numero_ecommerce',
    p_data->>'numero_venda',
    p_data->>'situacao',
    -- Pagamento
    p_data->>'metodo_pagamento',
    p_data->>'status_pagamento',
    p_data->>'tipo_pagamento',
    -- Valores
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
    -- Envio
    NULLIF(p_data->>'data_prevista','')::date,
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
    -- Status
    COALESCE(p_data->>'status_baixa', 'concluida'),
    p_data->>'status_mapeamento',
    p_data->>'status_insumos',
    -- Local estoque
    p_data->>'local_estoque',
    NULLIF(p_data->>'local_estoque_id','')::uuid,
    p_data->>'local_estoque_nome',
    -- Local venda
    NULLIF(p_data->>'local_venda_id','')::uuid,
    p_data->>'local_venda_nome',
    -- SKUs
    p_data->>'sku_kit',
    p_data->>'sku_estoque',
    p_data->>'skus_produtos',
    NULLIF(p_data->>'quantidade_total','')::integer,
    NULLIF(p_data->>'quantidade_itens','')::integer,
    NULLIF(p_data->>'quantidade_kit','')::integer,
    NULLIF(p_data->>'qtd_kit','')::integer,
    NULLIF(p_data->>'total_itens','')::integer,
    -- ML
    p_data->>'pack_id',
    p_data->>'pickup_id',
    p_data->>'pack_status',
    p_data->>'pack_status_detail',
    CASE WHEN p_data->'tags' IS NOT NULL THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'tags')) ELSE NULL END,
    p_data->>'power_seller_status',
    p_data->>'level_id',
    NULLIF(p_data->>'date_created','')::timestamptz,
    p_data->>'marketplace_origem',
    -- Metadados
    NULLIF(p_data->>'integration_account_id', '')::uuid,
    NULLIF(p_data->>'created_by','')::uuid,
    CASE WHEN p_data->'raw' IS NOT NULL THEN p_data->'raw' ELSE NULL END,
    CASE WHEN p_data->'raw_data' IS NOT NULL THEN p_data->'raw_data' ELSE NULL END,
    CASE WHEN p_data->'meta' IS NOT NULL THEN p_data->'meta' ELSE NULL END,
    NULLIF(p_data->>'ultima_atualizacao','')::timestamptz,
    NULLIF(p_data->>'last_updated','')::timestamptz
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
      'message', 'Registro já existe no histórico (id_unico duplicado)'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro ao inserir registro: ' || SQLERRM
    );
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.hv_insert(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hv_insert(jsonb) TO service_role;