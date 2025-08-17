-- Security fix: Remove insecure historico_vendas_safe view and replace with secure function
-- This prevents unauthorized access to customer sales data across organizations

-- Drop the insecure view
DROP VIEW IF EXISTS public.historico_vendas_safe;

-- Create a secure function that replaces the view functionality
CREATE OR REPLACE FUNCTION public.get_historico_vendas_safe(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  id_unico text,
  numero_pedido text,
  sku_produto text,
  descricao text,
  quantidade integer,
  valor_unitario numeric,
  valor_total numeric,
  cliente_nome text,
  cliente_documento text,
  status text,
  observacoes text,
  data_pedido date,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  ncm text,
  codigo_barras text,
  pedido_id text,
  cpf_cnpj text,
  valor_frete numeric,
  data_prevista date,
  obs text,
  obs_interna text,
  cidade text,
  uf text,
  url_rastreamento text,
  situacao text,
  codigo_rastreamento text,
  numero_ecommerce text,
  valor_desconto numeric,
  numero_venda text,
  sku_estoque text,
  sku_kit text,
  qtd_kit integer,
  total_itens integer
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Use the existing secure RPC that already handles organization filtering and PII masking
  SELECT * FROM public.get_historico_vendas_masked(_start, _end, _search, _limit, _offset);
$$;

-- Grant execute permission to authenticated users only
REVOKE ALL ON FUNCTION public.get_historico_vendas_safe FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_safe TO authenticated;

-- Add security comment
COMMENT ON FUNCTION public.get_historico_vendas_safe IS 'Secure function that replaces historico_vendas_safe view. Enforces organization-scoped access and PII masking through get_historico_vendas_masked RPC.';