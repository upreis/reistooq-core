-- ✅ CORREÇÃO: Criar função RPC get_pedidos_masked que estava faltando
CREATE OR REPLACE FUNCTION public.get_pedidos_masked(
  _search text DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
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
  created_at timestamptz,
  updated_at timestamptz
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
    AND (_search IS NULL OR (
      p.numero ILIKE '%' || _search || '%' OR
      p.nome_cliente ILIKE '%' || _search || '%' OR
      p.cpf_cnpj ILIKE '%' || _search || '%'
    ))
    AND (_start IS NULL OR p.data_pedido >= _start)
    AND (_end IS NULL OR p.data_pedido <= _end)
  ORDER BY p.created_at DESC
  LIMIT COALESCE(_limit, 100)
  OFFSET COALESCE(_offset, 0);
END;
$function$;