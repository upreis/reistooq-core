-- RESTAURAR: get_pedidos_masked com TODOS os filtros originais
-- Incluindo situacao e integration_account_id que foram removidos incorretamente

DROP FUNCTION IF EXISTS public.get_pedidos_masked(text, date, date, integer, integer);

CREATE OR REPLACE FUNCTION public.get_pedidos_masked(
  _search text DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0,
  _situacao text[] DEFAULT NULL,
  _integration_account_id uuid DEFAULT NULL,
  _cidade text DEFAULT NULL,
  _uf text DEFAULT NULL,
  _valor_min numeric DEFAULT NULL,
  _valor_max numeric DEFAULT NULL
)
RETURNS TABLE(
  id text,
  numero text,
  nome_cliente text,
  cpf_cnpj text,
  data_pedido date,
  situacao text,
  valor_total numeric,
  valor_frete numeric,
  valor_desconto numeric,
  numero_ecommerce text,
  numero_venda text,
  empresa text,
  cidade text,
  uf text,
  obs text,
  integration_account_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.numero,
    p.nome_cliente,
    p.cpf_cnpj,
    p.data_pedido,
    p.situacao,
    p.valor_total,
    p.valor_frete,
    p.valor_desconto,
    p.numero_ecommerce,
    p.numero_venda,
    p.empresa,
    p.cidade,
    p.uf,
    p.obs,
    p.integration_account_id,
    p.created_at,
    p.updated_at
  FROM public.pedidos p
  JOIN public.integration_accounts ia ON ia.id = p.integration_account_id
  WHERE ia.organization_id = public.get_current_org_id()
    AND public.has_permission('orders:read')
    -- Filtro por texto
    AND (_search IS NULL OR (
      p.numero ILIKE '%' || _search || '%' OR
      p.nome_cliente ILIKE '%' || _search || '%' OR
      p.cpf_cnpj ILIKE '%' || _search || '%'
    ))
    -- Filtro por data
    AND (_start IS NULL OR p.data_pedido >= _start)
    AND (_end IS NULL OR p.data_pedido <= _end)
    -- FILTRO DE SITUAÇÃO (que eu removi incorretamente)
    AND (_situacao IS NULL OR p.situacao = ANY(_situacao))
    -- FILTRO DE CONTA INTEGRATION (que eu removi incorretamente)
    AND (_integration_account_id IS NULL OR p.integration_account_id = _integration_account_id)
    -- Filtros geográficos
    AND (_cidade IS NULL OR p.cidade ILIKE '%' || _cidade || '%')
    AND (_uf IS NULL OR p.uf = _uf)
    -- Filtros de valor
    AND (_valor_min IS NULL OR p.valor_total >= _valor_min)
    AND (_valor_max IS NULL OR p.valor_total <= _valor_max)
  ORDER BY p.created_at DESC
  LIMIT COALESCE(_limit, 100)
  OFFSET COALESCE(_offset, 0);
END;
$function$;