-- Create SECURITY DEFINER RPC to insert into historico_vendas bypassing RLS
CREATE OR REPLACE FUNCTION public.hv_insert(p jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
  v_data_pedido date;
BEGIN
  -- Ensure required fields and sane defaults
  v_data_pedido := COALESCE( (p->>'data_pedido')::date, (now() at time zone 'UTC')::date );

  INSERT INTO public.historico_vendas (
    id_unico, numero_pedido, sku_produto, descricao, quantidade, valor_unitario, valor_total,
    cliente_nome, cliente_documento, status, observacoes, data_pedido, sku_estoque, sku_kit,
    qtd_kit, total_itens, cpf_cnpj, empresa, cidade, uf, numero_ecommerce, numero_venda,
    valor_frete, valor_desconto, data_prevista, obs, obs_interna, codigo_rastreamento,
    url_rastreamento, integration_account_id
  ) VALUES (
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
    NULLIF(p->>'sku_estoque',''),
    NULLIF(p->>'sku_kit',''),
    COALESCE( (p->>'qtd_kit')::int, 0 ),
    COALESCE( (p->>'total_itens')::int, 0 ),
    NULLIF(p->>'cpf_cnpj',''),
    NULLIF(p->>'empresa',''),
    NULLIF(p->>'cidade',''),
    NULLIF(p->>'uf',''),
    NULLIF(p->>'numero_ecommerce',''),
    NULLIF(p->>'numero_venda',''),
    COALESCE( (p->>'valor_frete')::numeric, 0 ),
    COALESCE( (p->>'valor_desconto')::numeric, 0 ),
    (p->>'data_prevista')::date,
    NULLIF(p->>'obs',''),
    NULLIF(p->>'obs_interna',''),
    NULLIF(p->>'codigo_rastreamento',''),
    NULLIF(p->>'url_rastreamento',''),
    NULLIF(p->>'integration_account_id','')::uuid
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Allow calling from API roles
GRANT EXECUTE ON FUNCTION public.hv_insert(jsonb) TO anon, authenticated, service_role;