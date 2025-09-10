-- Criar função RPC segura para acessar histórico de vendas
CREATE OR REPLACE FUNCTION public.get_historico_vendas_safe(
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0,
  _search text DEFAULT NULL,
  _date_from date DEFAULT NULL,
  _date_to date DEFAULT NULL,
  _status text DEFAULT NULL,
  _integration_account_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  id_unico text,
  numero_pedido text,
  sku_produto text,
  descricao text,
  quantidade integer,
  valor_unitario numeric,
  valor_total numeric,
  cliente_nome text,
  cliente_documento text,
  status text,
  observacoes text,
  data_pedido date,
  created_at timestamptz,
  updated_at timestamptz,
  ncm text,
  codigo_barras text,
  pedido_id text,
  cpf_cnpj text,
  valor_frete numeric,
  data_prevista date,
  obs text,
  obs_interna text,
  cidade text,
  uf text,
  url_rastreamento text,
  situacao text,
  codigo_rastreamento text,
  numero_ecommerce text,
  valor_desconto numeric,
  numero_venda text,
  sku_estoque text,
  sku_kit text,
  qtd_kit integer,
  total_itens integer,
  empresa text,
  integration_account_id uuid,
  meta jsonb,
  nome_completo text,
  ultima_atualizacao timestamptz,
  quantidade_total integer,
  titulo_produto text,
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
  status_mapeamento text,
  quantidade_kit integer,
  status_baixa text,
  status_envio text,
  logistic_mode_principal text,
  tipo_logistico text,
  tipo_metodo_envio text,
  tipo_entrega text,
  substatus_estado_atual text,
  modo_envio_combinado text,
  metodo_envio_combinado text,
  created_by uuid,
  origem text,
  raw jsonb,
  skus_produtos text[],
  rua text,
  numero text,
  bairro text,
  cep text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Se integration_account_id não for fornecido, buscar as contas do usuário
  IF _integration_account_id IS NULL THEN
    -- Buscar todas as contas integradas do usuário
    RETURN QUERY
    SELECT hv.*
    FROM historico_vendas hv
    INNER JOIN integration_accounts ia ON hv.integration_account_id = ia.id
    WHERE ia.user_id = auth.uid()
      AND (_search IS NULL OR (
        hv.numero_pedido ILIKE '%' || _search || '%' OR
        hv.cliente_nome ILIKE '%' || _search || '%' OR
        hv.nome_completo ILIKE '%' || _search || '%' OR
        hv.sku_produto ILIKE '%' || _search || '%'
      ))
      AND (_date_from IS NULL OR hv.data_pedido >= _date_from)
      AND (_date_to IS NULL OR hv.data_pedido <= _date_to)
      AND (_status IS NULL OR hv.status = _status)
    ORDER BY hv.created_at DESC
    LIMIT _limit
    OFFSET _offset;
  ELSE
    -- Verificar se o usuário tem acesso à conta específica
    IF NOT EXISTS (
      SELECT 1 FROM integration_accounts 
      WHERE id = _integration_account_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Acesso negado à conta de integração especificada';
    END IF;

    -- Buscar dados da conta específica
    RETURN QUERY
    SELECT hv.*
    FROM historico_vendas hv
    WHERE hv.integration_account_id = _integration_account_id
      AND (_search IS NULL OR (
        hv.numero_pedido ILIKE '%' || _search || '%' OR
        hv.cliente_nome ILIKE '%' || _search || '%' OR
        hv.nome_completo ILIKE '%' || _search || '%' OR
        hv.sku_produto ILIKE '%' || _search || '%'
      ))
      AND (_date_from IS NULL OR hv.data_pedido >= _date_from)
      AND (_date_to IS NULL OR hv.data_pedido <= _date_to)
      AND (_status IS NULL OR hv.status = _status)
    ORDER BY hv.created_at DESC
    LIMIT _limit
    OFFSET _offset;
  END IF;
END;
$$;

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_safe TO authenticated;

-- Comentário da função
COMMENT ON FUNCTION public.get_historico_vendas_safe IS 'Função segura para acessar histórico de vendas com controle de acesso por usuário e integration_account_id';