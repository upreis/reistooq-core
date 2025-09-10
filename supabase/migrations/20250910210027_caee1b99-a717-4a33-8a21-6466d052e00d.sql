-- Wrapper sem sobrecarga para evitar PGRST203
CREATE OR REPLACE FUNCTION public.get_historico_vendas_browse(
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0,
  _search text DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date date DEFAULT NULL
)
RETURNS SETOF public.historico_vendas
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.get_historico_vendas_masked(
    _search := _search,
    _start := _start,
    _end := _end,
    _limit := _limit,
    _offset := _offset
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_historico_vendas_browse TO authenticated;