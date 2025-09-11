-- Remover funções existentes
DROP FUNCTION IF EXISTS public.get_mapeamentos_by_skus(text[]);
DROP FUNCTION IF EXISTS public.count_baixados(uuid[], text, text, text);

-- Criar função RPC para buscar mapeamentos por SKUs
CREATE OR REPLACE FUNCTION public.get_mapeamentos_by_skus(skus text[])
RETURNS TABLE(sku_pedido text, sku_correspondente text, sku_simples text, quantidade integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    m.sku_pedido,
    m.sku_correspondente,
    m.sku_simples,
    m.quantidade
  FROM public.mapeamentos_depara m 
  WHERE m.sku_pedido = ANY(skus) 
    AND m.ativo = true
    AND m.organization_id = public.get_current_org_id();
END;
$$;

-- Criar função RPC para contar baixados do histórico
CREATE OR REPLACE FUNCTION public.count_baixados(
  _account_ids uuid[] DEFAULT NULL,
  _from text DEFAULT NULL, 
  _to text DEFAULT NULL,
  _search text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = public
AS $$
DECLARE
  baixados_count integer := 0;
BEGIN
  -- Contar registros no histórico de vendas com filtros
  SELECT COUNT(*)::integer INTO baixados_count
  FROM public.historico_vendas h
  WHERE 1=1
    AND (_account_ids IS NULL OR h.integration_account_id = ANY(_account_ids))
    AND (_from IS NULL OR h.data_pedido >= _from::date)
    AND (_to IS NULL OR h.data_pedido <= _to::date) 
    AND (_search IS NULL OR h.numero_pedido ILIKE '%' || _search || '%' OR h.cliente_nome ILIKE '%' || _search || '%');
    
  RETURN COALESCE(baixados_count, 0);
END;
$$;