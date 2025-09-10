-- Nova função sem sobrecarga que implementa seleção com máscara diretamente
CREATE OR REPLACE FUNCTION public.get_historico_vendas_browse(
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0,
  _search text DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  id_unico text,
  numero_pedido text,
  sku_produto text,
  descricao text,
  quantidade integer,
  valor_total numeric,
  cliente_nome text,
  data_pedido date,
  status text,
  sku_estoque text,
  sku_kit text,
  quantidade_total integer,
  valor_pago numeric,
  frete_pago_cliente numeric,
  receita_flex_bonus numeric,
  custo_envio_seller numeric,
  desconto_cupom numeric,
  taxa_marketplace numeric,
  valor_liquido_vendedor numeric,
  status_pagamento text,
  metodo_pagamento text,
  cidade text,
  uf text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    hv.id,
    hv.id_unico,
    hv.numero_pedido,
    hv.sku_produto,
    hv.descricao,
    hv.quantidade,
    hv.valor_total,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cliente_nome ELSE public.mask_name(hv.cliente_nome) END AS cliente_nome,
    hv.data_pedido,
    hv.status,
    hv.sku_estoque,
    hv.sku_kit,
    hv.quantidade_total,
    hv.valor_pago,
    hv.frete_pago_cliente,
    hv.receita_flex_bonus,
    hv.custo_envio_seller,
    hv.desconto_cupom,
    hv.taxa_marketplace,
    hv.valor_liquido_vendedor,
    hv.status_pagamento,
    hv.metodo_pagamento,
    hv.cidade,
    hv.uf,
    hv.created_at,
    hv.updated_at
  FROM public.historico_vendas hv
  WHERE 
    (_search IS NULL OR (
      hv.numero_pedido ILIKE '%' || _search || '%' OR
      hv.sku_produto ILIKE '%' || _search || '%' OR
      hv.cliente_nome ILIKE '%' || _search || '%' OR
      hv.id_unico ILIKE '%' || _search || '%'
    ))
    AND (_start IS NULL OR hv.data_pedido >= _start)
    AND (_end IS NULL OR hv.data_pedido <= _end)
  ORDER BY hv.created_at DESC
  LIMIT _limit
  OFFSET _offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_historico_vendas_browse TO authenticated;