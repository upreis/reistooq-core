-- Replace function to compute pending mappings from historico_vendas with rich filters
CREATE OR REPLACE FUNCTION public.count_mapeamentos_pendentes(
  _account_ids uuid[] DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL,
  _shipping_status text DEFAULT NULL,
  _cidade text DEFAULT NULL,
  _uf text DEFAULT NULL,
  _valor_min numeric DEFAULT NULL,
  _valor_max numeric DEFAULT NULL,
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
    AND (_shipping_status IS NULL OR lower(hv.status_envio) = lower(_shipping_status))
    AND (_cidade IS NULL OR hv.cidade ILIKE '%' || _cidade || '%')
    AND (_uf IS NULL OR hv.uf ILIKE '%' || _uf || '%')
    AND (_valor_min IS NULL OR hv.valor_total >= _valor_min)
    AND (_valor_max IS NULL OR hv.valor_total <= _valor_max)
    AND (
      _search IS NULL OR _search = '' OR (
        hv.numero_pedido ILIKE '%' || _search || '%'
        OR hv.numero_venda ILIKE '%' || _search || '%'
        OR hv.cliente_nome ILIKE '%' || _search || '%'
      )
    )
    AND (
      -- Considera mapeamento pendente/incompleto
      (COALESCE(hv.sku_estoque, '') = '' AND COALESCE(hv.sku_kit, '') = '')
      OR lower(COALESCE(hv.status_mapeamento, '')) IN ('pendente','incompleto','aguardando')
    );

  RETURN COALESCE(v_count, 0);
END;
$$;