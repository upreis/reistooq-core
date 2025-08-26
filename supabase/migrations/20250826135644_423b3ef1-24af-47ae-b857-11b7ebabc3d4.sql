-- Função de debug para entender o que está acontecendo
CREATE OR REPLACE FUNCTION public.debug_historico_visibilidade()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_org_id uuid;
  result json;
BEGIN
  -- Obter organização atual do usuário
  current_org_id := public.get_current_org_id();
  
  SELECT json_build_object(
    'current_org_id', current_org_id,
    'user_has_permission_historico_view', public.has_permission('historico:view'),
    'user_has_permission_vendas_read', public.has_permission('vendas:read'),
    'user_has_permission_vendas_view_pii', public.has_permission('vendas:view_pii'),
    'total_historico_vendas', (SELECT count(*) FROM public.historico_vendas),
    'total_integration_accounts', (SELECT count(*) FROM public.integration_accounts),
    'accounts_for_org', (
      SELECT json_agg(json_build_object('id', id, 'name', name, 'provider', provider, 'is_active', is_active))
      FROM public.integration_accounts 
      WHERE organization_id = current_org_id
    ),
    'vendas_por_account', (
      SELECT json_agg(json_build_object('account_id', integration_account_id, 'count', cnt))
      FROM (
        SELECT integration_account_id, count(*) as cnt 
        FROM public.historico_vendas 
        GROUP BY integration_account_id
      ) x
    ),
    'sample_vendas_visibles', (
      SELECT json_agg(json_build_object('id', hv.id, 'id_unico', hv.id_unico, 'account_id', hv.integration_account_id, 'account_org', ia.organization_id))
      FROM public.historico_vendas hv
      JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
      WHERE ia.organization_id = current_org_id
      LIMIT 3
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Executar debug
SELECT public.debug_historico_visibilidade();