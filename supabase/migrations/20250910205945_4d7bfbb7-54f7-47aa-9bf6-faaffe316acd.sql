-- Wrapper sem conflito para listar histórico mascarado (ajuste de tipo)
CREATE OR REPLACE FUNCTION public.get_historico_vendas_list(
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0,
  _search text DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL
)
RETURNS SETOF public.historico_vendas
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    hv.*
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

GRANT EXECUTE ON FUNCTION public.get_historico_vendas_list TO authenticated;