CREATE OR REPLACE FUNCTION public.get_pedidos_masked(
  _search text DEFAULT NULL,
  _start text DEFAULT NULL,
  _end text DEFAULT NULL,
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0,
  _situacao text DEFAULT NULL,
  _integration_account_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id text,
  numero text,
  nome_cliente text,
  cpf_cnpj text,
  data_pedido text,
  data_prevista text,
  situacao text,
  valor_total numeric,
  valor_frete numeric,
  valor_desconto numeric,
  numero_ecommerce text,
  numero_venda text,
  empresa text,
  cidade text,
  uf text,
  codigo_rastreamento text,
  url_rastreamento text,
  obs text,
  obs_interna text,
  integration_account_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
  sql_query text;
  where_conditions text[] := ARRAY[]::text[];
  final_query text;
BEGIN
  -- Obter a organização do usuário atual
  org_id := public.get_current_org_id();
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organização não encontrada para o usuário atual';
  END IF;

  -- Construir condições WHERE dinamicamente
  where_conditions := where_conditions || ARRAY['p.integration_account_id IN (SELECT id FROM integration_accounts WHERE organization_id = $1)'];

  IF _search IS NOT NULL AND _search != '' THEN
    where_conditions := where_conditions || ARRAY['(
      p.numero ILIKE ''%'' || $' || (array_length(where_conditions, 1) + 1)::text || ' || ''%'' OR
      p.nome_cliente ILIKE ''%'' || $' || (array_length(where_conditions, 1) + 1)::text || ' || ''%'' OR
      p.cpf_cnpj ILIKE ''%'' || $' || (array_length(where_conditions, 1) + 1)::text || ' || ''%'' OR
      p.numero_ecommerce ILIKE ''%'' || $' || (array_length(where_conditions, 1) + 1)::text || ' || ''%''
    )'];
  END IF;

  IF _situacao IS NOT NULL AND _situacao != '' THEN
    where_conditions := where_conditions || ARRAY['p.situacao = $' || (array_length(where_conditions, 1) + 1)::text];
  END IF;

  IF _integration_account_id IS NOT NULL THEN
    where_conditions := where_conditions || ARRAY['p.integration_account_id = $' || (array_length(where_conditions, 1) + 1)::text];
  END IF;

  IF _start IS NOT NULL AND _start != '' THEN
    where_conditions := where_conditions || ARRAY['p.data_pedido >= $' || (array_length(where_conditions, 1) + 1)::text || '::date'];
  END IF;

  IF _end IS NOT NULL AND _end != '' THEN
    where_conditions := where_conditions || ARRAY['p.data_pedido <= $' || (array_length(where_conditions, 1) + 1)::text || '::date'];
  END IF;

  -- Construir query final
  sql_query := 'SELECT 
    p.id::text,
    p.numero,
    p.nome_cliente,
    p.cpf_cnpj,
    p.data_pedido::text,
    p.data_prevista::text,
    p.situacao,
    p.valor_total,
    p.valor_frete,
    p.valor_desconto,
    p.numero_ecommerce,
    p.numero_venda,
    p.empresa,
    p.cidade,
    p.uf,
    p.codigo_rastreamento,
    p.url_rastreamento,
    p.obs,
    p.obs_interna,
    p.integration_account_id,
    p.created_at,
    p.updated_at
  FROM pedidos p';

  IF array_length(where_conditions, 1) > 0 THEN
    sql_query := sql_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
  END IF;

  sql_query := sql_query || ' ORDER BY p.data_pedido DESC, p.created_at DESC';
  sql_query := sql_query || ' LIMIT $' || (array_length(where_conditions, 1) + 1)::text;
  sql_query := sql_query || ' OFFSET $' || (array_length(where_conditions, 1) + 2)::text;

  -- Executar query com parâmetros
  IF _search IS NOT NULL AND _situacao IS NOT NULL AND _integration_account_id IS NOT NULL AND _start IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _situacao, _integration_account_id, _start, _end, _limit, _offset;
  ELSIF _search IS NOT NULL AND _situacao IS NOT NULL AND _integration_account_id IS NOT NULL AND _start IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _situacao, _integration_account_id, _start, _limit, _offset;
  ELSIF _search IS NOT NULL AND _situacao IS NOT NULL AND _integration_account_id IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _situacao, _integration_account_id, _end, _limit, _offset;
  ELSIF _search IS NOT NULL AND _situacao IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _situacao, _integration_account_id, _limit, _offset;
  ELSIF _search IS NOT NULL AND _situacao IS NOT NULL AND _start IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _situacao, _start, _end, _limit, _offset;
  ELSIF _search IS NOT NULL AND _situacao IS NOT NULL AND _start IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _situacao, _start, _limit, _offset;
  ELSIF _search IS NOT NULL AND _situacao IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _situacao, _end, _limit, _offset;
  ELSIF _search IS NOT NULL AND _situacao IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _situacao, _limit, _offset;
  ELSIF _search IS NOT NULL AND _integration_account_id IS NOT NULL AND _start IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _integration_account_id, _start, _end, _limit, _offset;
  ELSIF _search IS NOT NULL AND _integration_account_id IS NOT NULL AND _start IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _integration_account_id, _start, _limit, _offset;
  ELSIF _search IS NOT NULL AND _integration_account_id IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _integration_account_id, _end, _limit, _offset;
  ELSIF _search IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _integration_account_id, _limit, _offset;
  ELSIF _search IS NOT NULL AND _start IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _start, _end, _limit, _offset;
  ELSIF _search IS NOT NULL AND _start IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _start, _limit, _offset;
  ELSIF _search IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _end, _limit, _offset;
  ELSIF _search IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _search, _limit, _offset;
  ELSIF _situacao IS NOT NULL AND _integration_account_id IS NOT NULL AND _start IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _situacao, _integration_account_id, _start, _end, _limit, _offset;
  ELSIF _situacao IS NOT NULL AND _integration_account_id IS NOT NULL AND _start IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _situacao, _integration_account_id, _start, _limit, _offset;
  ELSIF _situacao IS NOT NULL AND _integration_account_id IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _situacao, _integration_account_id, _end, _limit, _offset;
  ELSIF _situacao IS NOT NULL AND _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _situacao, _integration_account_id, _limit, _offset;
  ELSIF _situacao IS NOT NULL AND _start IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _situacao, _start, _end, _limit, _offset;
  ELSIF _situacao IS NOT NULL AND _start IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _situacao, _start, _limit, _offset;
  ELSIF _situacao IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _situacao, _end, _limit, _offset;
  ELSIF _situacao IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _situacao, _limit, _offset;
  ELSIF _integration_account_id IS NOT NULL AND _start IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _integration_account_id, _start, _end, _limit, _offset;
  ELSIF _integration_account_id IS NOT NULL AND _start IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _integration_account_id, _start, _limit, _offset;
  ELSIF _integration_account_id IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _integration_account_id, _end, _limit, _offset;
  ELSIF _integration_account_id IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _integration_account_id, _limit, _offset;
  ELSIF _start IS NOT NULL AND _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _start, _end, _limit, _offset;
  ELSIF _start IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _start, _limit, _offset;
  ELSIF _end IS NOT NULL THEN
    RETURN QUERY EXECUTE sql_query USING org_id, _end, _limit, _offset;
  ELSE
    RETURN QUERY EXECUTE sql_query USING org_id, _limit, _offset;
  END IF;

END;
$$;