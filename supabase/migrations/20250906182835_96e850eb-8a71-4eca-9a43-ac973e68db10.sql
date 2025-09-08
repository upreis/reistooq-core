-- Create secure RPCs for global counts
-- 1) Count of downloaded (baixados) orders in historico_vendas
CREATE OR REPLACE FUNCTION public.count_baixados(
  _account_ids uuid[] DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL,
  _search text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.historico_vendas hv
  WHERE (_account_ids IS NULL OR hv.integration_account_id = ANY(_account_ids))
    AND (_from IS NULL OR hv.data_pedido >= _from)
    AND (_to IS NULL OR hv.data_pedido <= _to)
    AND (
      _search IS NULL OR _search = '' OR (
        hv.numero_pedido ILIKE '%' || _search || '%'
        OR hv.numero_venda ILIKE '%' || _search || '%'
        OR hv.cliente_nome ILIKE '%' || _search || '%'
      )
    );
  RETURN COALESCE(v_count, 0);
END;
$$;

-- 2) Count of pending mappings using mapeamentos_depara and org derived from integration_accounts
CREATE OR REPLACE FUNCTION public.count_mapeamentos_pendentes(
  _account_ids uuid[] DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_count integer;
BEGIN
  -- Derive organization from provided integration accounts (first one)
  IF _account_ids IS NOT NULL THEN
    SELECT ia.organization_id INTO v_org
    FROM public.integration_accounts ia
    WHERE ia.id = ANY(_account_ids)
    LIMIT 1;
  END IF;

  IF v_org IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(md.pedidos_aguardando), 0) INTO v_count
  FROM public.mapeamentos_depara md
  WHERE md.organization_id = v_org
    AND md.ativo = true
    AND (md.sku_correspondente IS NULL OR md.sku_correspondente = '')
    AND (_from IS NULL OR md.tempo_criacao_pedido::date >= _from)
    AND (_to IS NULL OR md.tempo_criacao_pedido::date <= _to);

  RETURN COALESCE(v_count, 0);
END;
$$;