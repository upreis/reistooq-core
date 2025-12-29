-- Adicionar coluna local_venda_id na tabela historico_vendas
ALTER TABLE public.historico_vendas 
ADD COLUMN IF NOT EXISTS local_venda_id uuid REFERENCES public.locais_venda(id);

-- Adicionar coluna local_venda_nome para facilitar exibição
ALTER TABLE public.historico_vendas 
ADD COLUMN IF NOT EXISTS local_venda_nome text;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_historico_vendas_local_venda_id 
ON public.historico_vendas(local_venda_id) 
WHERE local_venda_id IS NOT NULL;

-- Atualizar função hv_insert para aceitar local_venda_id e local_venda_nome
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
  -- Inserir na tabela historico_vendas com TODOS os campos incluindo local_venda
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
    
    -- Local de estoque e venda
    local_estoque, local_estoque_id, local_estoque_nome,
    local_venda_id, local_venda_nome,
    
    -- SKU e mapeamento
    sku_kit, sku_pedido, sku_estoque, sku_kit_mapeado, sku_original,
    quantidade_total,
    
    -- IDs e referências
    integration_account_id, organization_id, created_by
  )
  VALUES (
    -- Campos essenciais
    COALESCE(p_data->>'id_unico', gen_random_uuid()::text),
    p_data->>'numero_pedido',
    p_data->>'sku_produto',
    (p_data->>'quantidade')::integer,
    (p_data->>'valor_unitario')::numeric,
    (p_data->>'valor_total')::numeric,
    (p_data->>'data_pedido')::timestamptz,
    p_data->>'status',
    
    -- Dados do cliente
    p_data->>'cliente_nome',
    p_data->>'cliente_documento',
    p_data->>'nome_completo',
    p_data->>'cpf_cnpj',
    p_data->>'email',
    p_data->>'telefone',
    
    -- Empresa
    p_data->>'empresa',
    
    -- Endereço
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
    
    -- Produto
    p_data->>'titulo_produto',
    p_data->>'descricao',
    p_data->>'codigo_barras',
    p_data->>'ncm',
    p_data->>'observacoes',
    
    -- Origem
    p_data->>'origem',
    p_data->>'numero_ecommerce',
    p_data->>'numero_venda',
    p_data->>'situacao',
    
    -- Pagamento
    p_data->>'metodo_pagamento',
    p_data->>'status_pagamento',
    p_data->>'tipo_pagamento',
    (p_data->>'valor_frete')::numeric,
    (p_data->>'valor_desconto')::numeric,
    (p_data->>'valor_liquido_vendedor')::numeric,
    (p_data->>'taxa_marketplace')::numeric,
    (p_data->>'desconto_cupom')::numeric,
    (p_data->>'custo_envio_seller')::numeric,
    (p_data->>'valor_pago')::numeric,
    (p_data->>'frete_pago_cliente')::numeric,
    (p_data->>'receita_flex_bonus')::numeric,
    (p_data->>'custo_fixo_meli')::numeric,
    
    -- Entrega
    (p_data->>'data_prevista')::timestamptz,
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
    
    -- Status
    p_data->>'substatus_estado_atual',
    p_data->>'substatus_detail',
    p_data->>'status_baixa',
    p_data->>'status_mapeamento',
    p_data->>'conditions',
    p_data->>'status_insumos',
    
    -- Local de estoque e venda
    p_data->>'local_estoque',
    (p_data->>'local_estoque_id')::uuid,
    p_data->>'local_estoque_nome',
    (p_data->>'local_venda_id')::uuid,
    p_data->>'local_venda_nome',
    
    -- SKU
    p_data->>'sku_kit',
    p_data->>'sku_pedido',
    p_data->>'sku_estoque',
    p_data->>'sku_kit_mapeado',
    p_data->>'sku_original',
    (p_data->>'quantidade_total')::integer,
    
    -- IDs
    NULLIF(p_data->>'integration_account_id', '')::uuid,
    (p_data->>'organization_id')::uuid,
    (p_data->>'created_by')::uuid
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