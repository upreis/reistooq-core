-- Criar função RPC para buscar mapeamentos por SKUs
CREATE OR REPLACE FUNCTION get_mapeamentos_by_skus(skus text[])
RETURNS TABLE (
  sku_pedido text,
  sku_correspondente text,
  sku_simples text,
  quantidade integer,
  ativo boolean
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    m.sku_pedido,
    m.sku_correspondente,
    m.sku_simples,
    m.quantidade,
    m.ativo
  FROM mapeamentos_depara m
  WHERE m.sku_pedido = ANY(skus)
    AND m.ativo = true;
$$;