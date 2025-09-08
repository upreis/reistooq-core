CREATE OR REPLACE FUNCTION public.get_pedidos_masked(
  _integration_account_id uuid DEFAULT NULL,
  _start text DEFAULT NULL,
  _end text DEFAULT NULL,
  _situacao text DEFAULT NULL,
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0
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
BEGIN
  -- Obter a organização do usuário atual
  org_id := public.get_current_org_id();
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organização não encontrada para o usuário atual';
  END IF;

  RETURN QUERY
  SELECT 
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
  FROM pedidos p
  WHERE p.integration_account_id IN (
    SELECT id FROM integration_accounts WHERE organization_id = org_id
  )
  AND (_integration_account_id IS NULL OR p.integration_account_id = _integration_account_id)
  AND (_situacao IS NULL OR _situacao = '' OR p.situacao = _situacao)
  AND (_start IS NULL OR _start = '' OR p.data_pedido >= _start::date)
  AND (_end IS NULL OR _end = '' OR p.data_pedido <= _end::date)
  ORDER BY p.data_pedido DESC, p.created_at DESC
  LIMIT _limit
  OFFSET _offset;

END;
$$;