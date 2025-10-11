-- Função para buscar venda do histórico por ID de forma segura
-- Garante que apenas usuários da mesma organização podem acessar
CREATE OR REPLACE FUNCTION public.get_historico_venda_by_id(p_id uuid)
RETURNS TABLE (
  id uuid,
  id_unico text,
  numero_pedido text,
  sku_produto text,
  sku_estoque text,
  sku_kit text,
  quantidade integer,
  quantidade_total integer,
  valor_total numeric,
  valor_unitario numeric,
  cliente_nome text,
  nome_completo text,
  data_pedido date,
  status text,
  titulo_produto text,
  descricao text,
  observacoes text,
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
    hv.sku_estoque,
    hv.sku_kit,
    hv.quantidade,
    hv.quantidade_total,
    hv.valor_total,
    hv.valor_unitario,
    hv.cliente_nome,
    hv.nome_completo,
    hv.data_pedido,
    hv.status,
    hv.titulo_produto,
    hv.descricao,
    hv.observacoes,
    hv.created_at,
    hv.updated_at
  FROM public.historico_vendas hv
  WHERE hv.id = p_id
  AND EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.organizacao_id = (
      SELECT ia.organization_id 
      FROM public.integration_accounts ia 
      WHERE ia.id = hv.integration_account_id
    )
  )
  LIMIT 1;
$$;