-- Limpar funções conflitantes get_pedidos_masked
DROP FUNCTION IF EXISTS public.get_pedidos_masked(text, text, text, integer, integer, text, uuid);
DROP FUNCTION IF EXISTS public.get_pedidos_masked(text, date, date, integer, integer, text[], uuid, text, text, numeric, numeric);

-- Criar uma versão única e definitiva
CREATE OR REPLACE FUNCTION public.get_pedidos_masked_v2(
  _search text DEFAULT NULL,
  _start_date text DEFAULT NULL,
  _end_date text DEFAULT NULL,
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0,
  _situacao text DEFAULT NULL,
  _integration_account_id uuid DEFAULT NULL
) RETURNS TABLE(
  id text, numero text, nome_cliente text, cpf_cnpj text, 
  data_pedido text, data_prevista text, situacao text, 
  valor_total numeric, valor_frete numeric, valor_desconto numeric,
  numero_ecommerce text, numero_venda text, empresa text,
  cidade text, uf text, codigo_rastreamento text, url_rastreamento text,
  obs text, obs_interna text, integration_account_id uuid,
  created_at timestamp with time zone, updated_at timestamp with time zone
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  org_id uuid;
  where_conditions text[] := ARRAY[]::text[];
  param_count integer := 1;
  final_query text;
BEGIN
  org_id := public.get_current_org_id();
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organização não encontrada para o usuário atual';
  END IF;

  -- Base query
  final_query := 'SELECT 
    p.id::text, p.numero, p.nome_cliente, p.cpf_cnpj,
    p.data_pedido::text, p.data_prevista::text, p.situacao,
    p.valor_total, p.valor_frete, p.valor_desconto,
    p.numero_ecommerce, p.numero_venda, p.empresa,
    p.cidade, p.uf, p.codigo_rastreamento, p.url_rastreamento,
    p.obs, p.obs_interna, p.integration_account_id,
    p.created_at, p.updated_at
  FROM pedidos p
  JOIN integration_accounts ia ON ia.id = p.integration_account_id
  WHERE ia.organization_id = $1';

  -- Adicionar filtros dinâmicos
  IF _search IS NOT NULL AND _search != '' THEN
    param_count := param_count + 1;
    final_query := final_query || ' AND (p.numero ILIKE $' || param_count || ' OR p.nome_cliente ILIKE $' || param_count || ')';
  END IF;

  IF _start_date IS NOT NULL AND _start_date != '' THEN
    param_count := param_count + 1;
    final_query := final_query || ' AND p.data_pedido >= $' || param_count || '::date';
  END IF;

  IF _end_date IS NOT NULL AND _end_date != '' THEN
    param_count := param_count + 1;
    final_query := final_query || ' AND p.data_pedido <= $' || param_count || '::date';
  END IF;

  IF _situacao IS NOT NULL AND _situacao != '' THEN
    param_count := param_count + 1;
    final_query := final_query || ' AND p.situacao = $' || param_count;
  END IF;

  IF _integration_account_id IS NOT NULL THEN
    param_count := param_count + 1;
    final_query := final_query || ' AND p.integration_account_id = $' || param_count;
  END IF;

  final_query := final_query || ' ORDER BY p.data_pedido DESC, p.created_at DESC LIMIT $' || (param_count + 1) || ' OFFSET $' || (param_count + 2);

  -- Executar com parâmetros corretos
  IF _search IS NOT NULL AND _start_date IS NOT NULL AND _end_date IS NOT NULL AND _situacao IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, '%' || _search || '%', _start_date, _end_date, _situacao, _integration_account_id, _limit, _offset;
  ELSIF _search IS NOT NULL AND _start_date IS NOT NULL AND _end_date IS NOT NULL AND _situacao IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, '%' || _search || '%', _start_date, _end_date, _situacao, _limit, _offset;
  ELSIF _search IS NOT NULL AND _start_date IS NOT NULL AND _end_date IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, '%' || _search || '%', _start_date, _end_date, _integration_account_id, _limit, _offset;
  ELSIF _start_date IS NOT NULL AND _end_date IS NOT NULL AND _situacao IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _start_date, _end_date, _situacao, _integration_account_id, _limit, _offset;
  ELSIF _search IS NOT NULL AND _start_date IS NOT NULL AND _end_date IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, '%' || _search || '%', _start_date, _end_date, _limit, _offset;
  ELSIF _search IS NOT NULL AND _situacao IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, '%' || _search || '%', _situacao, _integration_account_id, _limit, _offset;
  ELSIF _start_date IS NOT NULL AND _end_date IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _start_date, _end_date, _integration_account_id, _limit, _offset;
  ELSIF _start_date IS NOT NULL AND _end_date IS NOT NULL AND _situacao IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _start_date, _end_date, _situacao, _limit, _offset;
  ELSIF _search IS NOT NULL AND _start_date IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, '%' || _search || '%', _start_date, _limit, _offset;
  ELSIF _search IS NOT NULL AND _end_date IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, '%' || _search || '%', _end_date, _limit, _offset;
  ELSIF _search IS NOT NULL AND _situacao IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, '%' || _search || '%', _situacao, _limit, _offset;
  ELSIF _search IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, '%' || _search || '%', _integration_account_id, _limit, _offset;
  ELSIF _start_date IS NOT NULL AND _end_date IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _start_date, _end_date, _limit, _offset;
  ELSIF _start_date IS NOT NULL AND _situacao IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _start_date, _situacao, _limit, _offset;
  ELSIF _start_date IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _start_date, _integration_account_id, _limit, _offset;
  ELSIF _end_date IS NOT NULL AND _situacao IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _end_date, _situacao, _limit, _offset;
  ELSIF _end_date IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _end_date, _integration_account_id, _limit, _offset;
  ELSIF _situacao IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _situacao, _integration_account_id, _limit, _offset;
  ELSIF _search IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, '%' || _search || '%', _limit, _offset;
  ELSIF _start_date IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _start_date, _limit, _offset;
  ELSIF _end_date IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _end_date, _limit, _offset;
  ELSIF _situacao IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _situacao, _limit, _offset;
  ELSIF _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE final_query USING org_id, _integration_account_id, _limit, _offset;
  ELSE
    RETURN QUERY EXECUTE final_query USING org_id, _limit, _offset;
  END IF;
END;
$$;