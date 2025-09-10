-- Expandir função hv_insert para capturar TODOS os campos da fotografia completa
-- Esta correção garante que todos os dados da página /pedidos sejam preservados no /historico

DROP FUNCTION IF EXISTS public.hv_insert(p jsonb);

CREATE OR REPLACE FUNCTION public.hv_insert(p jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_data_pedido date;
  v_integration_account_id uuid;
  v_org_id uuid;
BEGIN
  -- Ensure required fields and sane defaults
  v_data_pedido := COALESCE( (p->>'data_pedido')::date, (now() at time zone 'UTC')::date );
  
  -- Get current organization
  v_org_id := public.get_current_org_id();
  
  -- Handle integration_account_id - NUNCA aceitar NULL
  v_integration_account_id := NULLIF(p->>'integration_account_id','')::uuid;
  
  -- Se vier NULL, buscar/criar uma conta padrão automaticamente
  IF v_integration_account_id IS NULL THEN
    -- Buscar primeira conta ativa da organização
    SELECT id INTO v_integration_account_id 
    FROM public.integration_accounts 
    WHERE organization_id = v_org_id AND is_active = true 
    LIMIT 1;
    
    -- Se não encontrou conta ativa, pegar qualquer conta da org
    IF v_integration_account_id IS NULL THEN
      SELECT id INTO v_integration_account_id 
      FROM public.integration_accounts 
      WHERE organization_id = v_org_id 
      LIMIT 1;
    END IF;
    
    -- Se AINDA não tem conta, criar uma padrão COM PROVIDER VÁLIDO
    IF v_integration_account_id IS NULL THEN
      INSERT INTO public.integration_accounts (name, provider, organization_id, is_active)
      VALUES ('Sistema Padrão (hv_insert)', 'tiny', v_org_id, true)
      RETURNING id INTO v_integration_account_id;
    END IF;
  END IF;

  -- ✅ INSERÇÃO COMPLETA COM TODOS OS CAMPOS DISPONÍVEIS
  INSERT INTO public.historico_vendas (
    -- CAMPOS BÁSICOS
    id_unico, numero_pedido, sku_produto, descricao, quantidade, valor_unitario, valor_total,
    cliente_nome, cliente_documento, status, observacoes, data_pedido, 
    
    -- CAMPOS EXPANDIDOS DA FOTOGRAFIA COMPLETA
    sku_estoque, sku_kit, qtd_kit, total_itens, cpf_cnpj, empresa, cidade, uf, 
    numero_ecommerce, numero_venda, valor_frete, valor_desconto, data_prevista, 
    obs, obs_interna, codigo_rastreamento, url_rastreamento, integration_account_id,
    
    -- CAMPOS DE ENDEREÇO COMPLETO
    rua, numero, bairro, cep,
    
    -- CAMPOS DE PRODUTOS E INVENTÁRIO  
    skus_produtos, quantidade_total, quantidade_itens, titulo_produto,
    
    -- CAMPOS FINANCEIROS EXPANDIDOS
    frete_pago_cliente, receita_flex_bonus, custo_envio_seller, desconto_cupom,
    taxa_marketplace, valor_liquido_vendedor, valor_pago,
    
    -- CAMPOS DE PAGAMENTO
    metodo_pagamento, status_pagamento, tipo_pagamento,
    
    -- CAMPOS DE ENVIO E LOGÍSTICA
    status_envio, logistic_mode_principal, tipo_logistico, tipo_metodo_envio,
    tipo_entrega, substatus_estado_atual, modo_envio_combinado, metodo_envio_combinado,
    
    -- CAMPOS DE LOGÍSTICA ADICIONAL
    delivery_type, substatus_detail, shipping_method, shipping_mode,
    
    -- CAMPOS MERCADO LIVRE ESPECÍFICOS
    date_created, pack_id, pickup_id, pack_status, pack_status_detail, tags,
    
    -- CAMPOS DE STATUS E MAPEAMENTO
    situacao, status_mapeamento, status_baixa,
    
    -- CAMPOS DE DADOS COMPLETOS
    nome_completo, ultima_atualizacao, last_updated,
    
    -- CAMPOS DE METADADOS
    raw, meta, created_by
  ) VALUES (
    -- CAMPOS BÁSICOS
    NULLIF(p->>'id_unico',''),
    COALESCE(NULLIF(p->>'numero_pedido',''), NULLIF(p->>'id_unico','')),
    COALESCE(NULLIF(p->>'sku_produto',''), 'BAIXA_ESTOQUE'),
    NULLIF(p->>'descricao',''),
    COALESCE( (p->>'quantidade')::int, 0 ),
    COALESCE( (p->>'valor_unitario')::numeric, 0 ),
    COALESCE( (p->>'valor_total')::numeric, 0 ),
    NULLIF(p->>'cliente_nome',''),
    NULLIF(p->>'cliente_documento',''),
    COALESCE(NULLIF(p->>'status',''), 'baixado'),
    NULLIF(p->>'observacoes',''),
    v_data_pedido,
    
    -- CAMPOS EXPANDIDOS DA FOTOGRAFIA COMPLETA
    NULLIF(p->>'sku_estoque',''),
    NULLIF(p->>'sku_kit',''), 
    COALESCE((p->>'qtd_kit')::int, 0),
    COALESCE((p->>'total_itens')::int, 0),
    NULLIF(p->>'cpf_cnpj',''),
    NULLIF(p->>'empresa',''),
    NULLIF(p->>'cidade',''),
    NULLIF(p->>'uf',''),
    NULLIF(p->>'numero_ecommerce',''),
    NULLIF(p->>'numero_venda',''),
    COALESCE((p->>'valor_frete')::numeric, 0),
    COALESCE((p->>'valor_desconto')::numeric, 0),
    (p->>'data_prevista')::date,
    NULLIF(p->>'obs',''),
    NULLIF(p->>'obs_interna',''),
    NULLIF(p->>'codigo_rastreamento',''),
    NULLIF(p->>'url_rastreamento',''),
    v_integration_account_id,
    
    -- CAMPOS DE ENDEREÇO COMPLETO
    NULLIF(p->>'rua',''),
    NULLIF(p->>'numero',''),
    NULLIF(p->>'bairro',''),
    NULLIF(p->>'cep',''),
    
    -- CAMPOS DE PRODUTOS E INVENTÁRIO
    NULLIF(p->>'skus_produtos',''),
    COALESCE((p->>'quantidade_total')::int, 0),
    COALESCE((p->>'quantidade_itens')::int, 0),
    NULLIF(p->>'titulo_produto',''),
    
    -- CAMPOS FINANCEIROS EXPANDIDOS
    COALESCE((p->>'frete_pago_cliente')::numeric, 0),
    COALESCE((p->>'receita_flex_bonus')::numeric, 0),
    COALESCE((p->>'custo_envio_seller')::numeric, 0),
    COALESCE((p->>'desconto_cupom')::numeric, 0),
    COALESCE((p->>'taxa_marketplace')::numeric, 0),
    COALESCE((p->>'valor_liquido_vendedor')::numeric, 0),
    COALESCE((p->>'valor_pago')::numeric, 0),
    
    -- CAMPOS DE PAGAMENTO
    NULLIF(p->>'metodo_pagamento',''),
    NULLIF(p->>'status_pagamento',''),
    NULLIF(p->>'tipo_pagamento',''),
    
    -- CAMPOS DE ENVIO E LOGÍSTICA
    NULLIF(p->>'status_envio',''),
    NULLIF(p->>'logistic_mode_principal',''),
    NULLIF(p->>'tipo_logistico',''),
    NULLIF(p->>'tipo_metodo_envio',''),
    NULLIF(p->>'tipo_entrega',''),
    NULLIF(p->>'substatus_estado_atual',''),
    NULLIF(p->>'modo_envio_combinado',''),
    NULLIF(p->>'metodo_envio_combinado',''),
    
    -- CAMPOS DE LOGÍSTICA ADICIONAL
    NULLIF(p->>'delivery_type',''),
    NULLIF(p->>'substatus_detail',''),
    NULLIF(p->>'shipping_method',''),
    NULLIF(p->>'shipping_mode',''),
    
    -- CAMPOS MERCADO LIVRE ESPECÍFICOS
    (p->>'date_created')::timestamp with time zone,
    NULLIF(p->>'pack_id',''),
    NULLIF(p->>'pickup_id',''),
    NULLIF(p->>'pack_status',''),
    NULLIF(p->>'pack_status_detail',''),
    CASE 
      WHEN p->'tags' IS NOT NULL AND jsonb_typeof(p->'tags') = 'array' 
      THEN ARRAY(SELECT jsonb_array_elements_text(p->'tags'))
      ELSE NULL 
    END,
    
    -- CAMPOS DE STATUS E MAPEAMENTO
    NULLIF(p->>'situacao',''),
    NULLIF(p->>'status_mapeamento',''),
    COALESCE(NULLIF(p->>'status_baixa',''), 'concluida'),
    
    -- CAMPOS DE DADOS COMPLETOS
    NULLIF(p->>'nome_completo',''),
    (p->>'ultima_atualizacao')::timestamp with time zone,
    (p->>'last_updated')::timestamp with time zone,
    
    -- CAMPOS DE METADADOS
    p->'raw',
    COALESCE(p->'meta', '{}'::jsonb),
    COALESCE(NULLIF(p->>'created_by','')::uuid, auth.uid())
  ) RETURNING id INTO v_id;

  RETURN v_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro para debug
    RAISE LOG 'Erro em hv_insert: % | Dados: %', SQLERRM, p;
    RAISE;
END;
$function$;