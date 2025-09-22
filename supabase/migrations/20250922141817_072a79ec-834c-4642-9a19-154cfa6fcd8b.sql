-- ===================================================================
-- CORREÇÃO SEGURA: Resolver Conflito de Função
-- ===================================================================
-- Esta correção resolve o erro 300 removendo versões conflitantes
-- e criando uma única função funcional

-- 1. REMOVER TODAS as versões conflitantes
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(_search text, _start date, _end date, _limit integer, _offset integer);
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(_start date, _end date, _search text, _limit integer, _offset integer);
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(date, date, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(text, date, date, integer, integer);

-- 2. CRIAR UMA ÚNICA versão funcional
CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked(
  p_search text DEFAULT NULL,
  p_start date DEFAULT NULL,
  p_end date DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  numero_pedido text,
  data_pedido date,
  valor_total numeric,
  cliente_nome text,
  sku_produto text,
  quantidade integer,
  origem text,
  status text,
  integration_account_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    hv.id,
    hv.numero_pedido,
    hv.data_pedido,
    hv.valor_total,
    CASE 
      WHEN has_permission('historico:read_full') THEN hv.cliente_nome
      ELSE LEFT(COALESCE(hv.cliente_nome, ''), 3) || '***'
    END as cliente_nome,
    hv.sku_produto,
    hv.quantidade,
    hv.origem,
    hv.status,
    hv.integration_account_id
  FROM public.historico_vendas hv
  WHERE (auth.uid() IS NOT NULL)
    AND (p_start IS NULL OR hv.data_pedido >= p_start)
    AND (p_end IS NULL OR hv.data_pedido <= p_end)
    AND (p_search IS NULL OR hv.cliente_nome ILIKE '%' || p_search || '%' OR hv.numero_pedido ILIKE '%' || p_search || '%')
  ORDER BY hv.data_pedido DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;