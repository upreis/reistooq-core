-- Create RPC function to get low stock products count
-- This fixes the PostgREST limitation of comparing columns in filters

CREATE OR REPLACE FUNCTION public.get_low_stock_products_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.produtos
  WHERE ativo = true
    AND quantidade_atual <= estoque_minimo
    AND organization_id = public.get_current_org_id();
$$;

-- Create function to get low stock products (if needed for listing)
CREATE OR REPLACE FUNCTION public.get_low_stock_products()
RETURNS SETOF produtos
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.produtos
  WHERE ativo = true
    AND quantidade_atual <= estoque_minimo
    AND organization_id = public.get_current_org_id()
  ORDER BY created_at DESC;
$$;