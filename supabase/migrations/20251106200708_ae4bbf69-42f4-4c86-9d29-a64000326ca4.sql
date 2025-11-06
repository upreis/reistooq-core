-- 🔥 EMERGENCIAL: Recriar hv_insert - A função está faltando no banco
-- Esta migration DEVE ser executada para que o histórico de vendas funcione

-- Garantir que qualquer versão antiga seja removida
DROP FUNCTION IF EXISTS public.hv_insert(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.hv_insert(json) CASCADE;

-- Criar a função com TODOS os 84 campos da tabela historico_vendas
CREATE FUNCTION public.hv_insert(p_data jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
  v_inserted_id uuid;
BEGIN
  -- Inserir na tabela historico_vendas com TODOS os campos
  INSERT INTO public.historico_vendas (
    -- Campos essenciais
    id_unico, numero_pedido, sku_produto, quantidade, valor_unitario, valor_total,
    data_pedido, status, 
    
    -- Dados do cliente
    cliente_nome, cliente_documento, nome_completo, cpf_cnpj, email, telefone,
    
    -- Dados da empresa
    empresa,
    
    -- Endereço
    endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep,
    rua, numero, bairro, cidade, uf, cep,
    
    -- Produto
    titulo_produto, descricao, codigo_barras, ncm, observacoes,
    
    -- Origem e identificadores
    origem, numero_ecommerce, numero_venda, situacao,
    
    -- Pagamento
    metodo_pagamento, status_pagamento, tipo_pagamento, 
    valor_frete, valor_desconto, valor_liquido_vendedor, taxa_marketplace,
    desconto_cupom, custo_envio_seller, valor_pago, frete_pago_cliente,
    receita_flex_bonus, custo_fixo_meli,
    
    -- Entrega e rastreamento
    data_prevista, codigo_rastreamento, url_rastreamento, status_envio,
    shipping_method, shipping_mode, shipping_substatus, delivery_type, 
    tipo_entrega, metodo_envio_combinado, modo_envio_combinado,
    tipo_metodo_envio, tipo_logistico, logistic_type, logistic_mode_principal,
    
    -- Status e substatus
    substatus_estado_atual, substatus_detail, status_baixa, status_mapeamento,
    conditions, status_insumos,
    
    -- SKUs e quantidades
    sku_kit, sku_estoque, quantidade_kit, qtd_kit, 
    quantidade_itens, quantidade_total, total_itens,
    
    -- Packs e pickups
    pack_id, pickup_id, pack_status, pack_status_detail,
    
    -- Observações e tags
    obs, obs_interna, tags, skus_produtos,
    
    -- 🔥 CRÍTICO: Local de estoque (necessário para reversão)
    local_estoque_id, local_estoque_nome, local_estoque,
    
    -- Marketplace
    marketplace_origem, titulo_anuncio, power_seller_status, level_id,
    date_created, last_updated,
    
    -- Dados brutos e metadata
    raw_data, meta, raw,
    
    -- Integração
    integration_account_id, created_by
  ) VALUES (
    -- Campos essenciais
    p_data->>'id_unico', 
    p_data->>'numero_pedido', 
    p_data->>'sku_produto',
    COALESCE((p_data->>'quantidade')::integer, 0),
    COALESCE((p_data->>'valor_unitario')::numeric, 0),
    COALESCE((p_data->>'valor_total')::numeric, 0),
    COALESCE((p_data->>'data_pedido')::date, CURRENT_DATE),
    COALESCE(p_data->>'status', 'concluida'),
    
    -- Dados do cliente
    p_data->>'cliente_nome', 
    p_data->>'cliente_documento', 
    p_data->>'nome_completo',
    p_data->>'cpf_cnpj', 
    p_data->>'email', 
    p_data->>'telefone',
    
    -- Dados da empresa
    p_data->>'empresa',
    
    -- Endereço (versão original)
    p_data->>'endereco_rua', 
    p_data->>'endereco_numero', 
    p_data->>'endereco_bairro',
    p_data->>'endereco_cidade', 
    p_data->>'endereco_uf', 
    p_data->>'endereco_cep',
    
    -- Endereço (versão simplificada - fotografia 3.1)
    p_data->>'rua',
    p_data->>'numero',
    p_data->>'bairro',
    p_data->>'cidade',
    p_data->>'uf',
    p_data->>'cep',
    
    -- Produto
    p_data->>'titulo_produto', 
    p_data->>'descricao', 
    p_data->>'codigo_barras',
    p_data->>'ncm', 
    p_data->>'observacoes',
    
    -- Origem e identificadores
    p_data->>'origem',
    p_data->>'numero_ecommerce', 
    p_data->>'numero_venda', 
    p_data->>'situacao',
    
    -- Pagamento
    p_data->>'metodo_pagamento', 
    p_data->>'status_pagamento', 
    p_data->>'tipo_pagamento',
    COALESCE((p_data->>'valor_frete')::numeric, 0),
    COALESCE((p_data->>'valor_desconto')::numeric, 0),
    COALESCE((p_data->>'valor_liquido_vendedor')::numeric, 0),
    COALESCE((p_data->>'taxa_marketplace')::numeric, 0),
    COALESCE((p_data->>'desconto_cupom')::numeric, 0),
    COALESCE((p_data->>'custo_envio_seller')::numeric, 0),
    COALESCE((p_data->>'valor_pago')::numeric, 0),
    COALESCE((p_data->>'frete_pago_cliente')::numeric, 0),
    COALESCE((p_data->>'receita_flex_bonus')::numeric, 0),
    COALESCE((p_data->>'custo_fixo_meli')::numeric, 0),
    
    -- Entrega e rastreamento
    (p_data->>'data_prevista')::date, 
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
    
    -- Status e substatus
    p_data->>'substatus_estado_atual',
    p_data->>'substatus_detail', 
    p_data->>'status_baixa', 
    p_data->>'status_mapeamento',
    p_data->>'conditions',
    p_data->>'status_insumos',
    
    -- SKUs e quantidades
    p_data->>'sku_kit', 
    p_data->>'sku_estoque',
    COALESCE((p_data->>'quantidade_kit')::integer, 0),
    COALESCE((p_data->>'qtd_kit')::integer, 0),
    COALESCE((p_data->>'quantidade_itens')::integer, 0),
    COALESCE((p_data->>'quantidade_total')::integer, 0),
    COALESCE((p_data->>'total_itens')::integer, 0),
    
    -- Packs e pickups
    p_data->>'pack_id', 
    p_data->>'pickup_id', 
    p_data->>'pack_status',
    p_data->>'pack_status_detail',
    
    -- Observações e tags
    p_data->>'obs', 
    p_data->>'obs_interna',
    CASE 
      WHEN p_data->'tags' IS NOT NULL AND jsonb_typeof(p_data->'tags') = 'array' 
      THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'tags'))
      ELSE NULL 
    END,
    p_data->>'skus_produtos',
    
    -- 🔥 CRÍTICO: Local de estoque
    CASE 
      WHEN p_data->>'local_estoque_id' IS NOT NULL 
      THEN (p_data->>'local_estoque_id')::uuid
      ELSE NULL 
    END,
    p_data->>'local_estoque_nome',
    p_data->>'local_estoque',
    
    -- Marketplace
    p_data->>'marketplace_origem',
    p_data->>'titulo_anuncio',
    p_data->>'power_seller_status',
    p_data->>'level_id',
    CASE 
      WHEN p_data->>'date_created' IS NOT NULL 
      THEN (p_data->>'date_created')::timestamp with time zone
      ELSE NULL 
    END,
    CASE 
      WHEN p_data->>'last_updated' IS NOT NULL 
      THEN (p_data->>'last_updated')::timestamp with time zone
      ELSE NULL 
    END,
    
    -- Dados brutos e metadata
    p_data->'raw_data',
    COALESCE(p_data->'meta', '{}'::jsonb),
    p_data->'raw',
    
    -- Integração
    CASE 
      WHEN p_data->>'integration_account_id' IS NOT NULL 
      THEN (p_data->>'integration_account_id')::uuid
      ELSE NULL 
    END,
    COALESCE(auth.uid(), (p_data->>'created_by')::uuid)
  )
  RETURNING id INTO v_inserted_id;
  
  -- Retornar sucesso com o ID inserido
  v_result := json_build_object(
    'success', true, 
    'message', 'Histórico salvo com sucesso',
    'id', v_inserted_id
  );
  
  RETURN v_result;
  
EXCEPTION 
  WHEN OTHERS THEN
    -- Log detalhado do erro
    RAISE WARNING '🔥 Erro ao inserir histórico: % | SQLSTATE: %', SQLERRM, SQLSTATE;
    
    -- Retornar erro em formato JSON
    v_result := json_build_object(
      'success', false, 
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
    
    RETURN v_result;
END;
$$;

-- Adicionar comentário explicativo
COMMENT ON FUNCTION public.hv_insert(jsonb) IS 
'🔥 FUNÇÃO CRÍTICA: Insere fotografia completa no histórico de vendas
Inclui local_estoque_id (essencial para reversão de estoque)
Criada em: 2025-11-06
Versão: 3.2 - Emergencial';

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.hv_insert(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hv_insert(jsonb) TO service_role;