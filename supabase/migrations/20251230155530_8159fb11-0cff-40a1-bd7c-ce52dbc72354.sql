-- RPC segura para localizar vendas no histórico para estorno (inclui registros sem integration_account_id)
CREATE OR REPLACE FUNCTION public.hv_lookup_estorno(p_search text)
RETURNS TABLE (
  id uuid,
  id_unico text,
  numero_pedido text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
  WITH org AS (
    SELECT public.get_current_org_id() AS org_id
  )
  SELECT
    hv.id,
    hv.id_unico,
    hv.numero_pedido
  FROM public.historico_vendas hv
  LEFT JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
  LEFT JOIN public.locais_venda lv ON lv.id = hv.local_venda_id
  CROSS JOIN org
  WHERE
    -- exige permissão mínima para acessar histórico
    (public.has_permission('historico:view') OR public.has_permission('vendas:read'))
    AND (
      (hv.integration_account_id IS NOT NULL AND ia.organization_id = org.org_id)
      OR
      (hv.integration_account_id IS NULL AND lv.organization_id = org.org_id)
    )
    AND (
      p_search IS NULL OR p_search = ''
      OR hv.numero_pedido ILIKE '%' || p_search || '%'
      OR hv.id_unico ILIKE '%' || p_search || '%'
    )
  ORDER BY hv.created_at DESC
  LIMIT 20;
$$;