-- Unify RPC to avoid PostgREST 300 ambiguity on overloaded functions
-- 1) Drop existing overloaded variants of get_historico_vendas_safe
DROP FUNCTION IF EXISTS public.get_historico_vendas_safe(date, date, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_historico_vendas_safe(integer, integer, text, date, date, text);
DROP FUNCTION IF EXISTS public.get_historico_vendas_safe(text, date, date, integer, integer);
DROP FUNCTION IF EXISTS public.get_historico_vendas_safe(date, date, text, integer, integer, text);

-- 2) Recreate a single canonical wrapper that delegates to the masked function
--    IMPORTANT: SECURITY INVOKER to enforce RLS of underlying tables/functions
CREATE OR REPLACE FUNCTION public.get_historico_vendas_safe(
  _search text DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0
)
RETURNS SETOF public.historico_vendas
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  -- Delegates to the existing masked function using positional args to avoid ambiguity
  SELECT *
  FROM public.get_historico_vendas_masked(
    _search,  -- text
    _start,   -- date
    _end,     -- date
    _limit,   -- integer
    _offset   -- integer
  );
$$;

-- 3) Ensure execute permission only for authenticated role
REVOKE ALL ON FUNCTION public.get_historico_vendas_safe(text, date, date, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_safe(text, date, date, integer, integer) TO authenticated;