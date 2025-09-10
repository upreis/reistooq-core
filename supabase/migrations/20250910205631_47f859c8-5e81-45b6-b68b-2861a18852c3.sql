-- Resolver conflito de função get_historico_vendas_masked
-- Remover todas as versões e criar uma única versão simplificada

DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(text, date, date, integer, integer);
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(date, date, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(_search text, _start date, _end date, _limit integer, _offset integer);
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(_start date, _end date, _search text, _limit integer, _offset integer);

-- Criar função única e simplificada para histórico mascarado
CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked(
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0,
  _search text DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL
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
  sku_estoque text,
  sku_kit text,
  qtd_kit integer,
  total_itens integer,
  cpf_cnpj text,
  empresa text,
  cidade text,
  uf text,
  numero_ecommerce text,
  numero_venda text,
  valor_frete numeric,
  valor_desconto numeric,
  data_prevista date,
  obs text,
  obs_interna text,
  codigo_rastreamento text,
  url_rastreamento text,
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
    hv.valor_unitario,
    hv.valor_total,
    CASE 
      WHEN public.has_permission('vendas:view_pii') THEN hv.cliente_nome
      ELSE public.mask_name(hv.cliente_nome)
    END as cliente_nome,
    CASE 
      WHEN public.has_permission('vendas:view_pii') THEN hv.cliente_documento
      ELSE public.mask_document(hv.cliente_documento)
    END as cliente_documento,
    hv.status,
    hv.observacoes,
    hv.data_pedido,
    hv.sku_estoque,
    hv.sku_kit,
    hv.qtd_kit,
    hv.total_itens,
    CASE 
      WHEN public.has_permission('vendas:view_pii') THEN hv.cpf_cnpj
      ELSE public.mask_document(hv.cpf_cnpj)
    END as cpf_cnpj,
    hv.empresa,
    hv.cidade,
    hv.uf,
    hv.numero_ecommerce,
    hv.numero_venda,
    hv.valor_frete,
    hv.valor_desconto,
    hv.data_prevista,
    hv.obs,
    hv.obs_interna,
    hv.codigo_rastreamento,
    hv.url_rastreamento,
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

-- Garantir permissões de execução
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_masked TO authenticated;

-- Criar funções de mascaramento se não existirem
CREATE OR REPLACE FUNCTION public.mask_name(nome text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE 
    WHEN nome IS NULL OR nome = '' THEN ''
    WHEN length(nome) <= 3 THEN nome
    ELSE left(nome, 2) || repeat('*', greatest(length(nome) - 4, 1)) || right(nome, 2)
  END;
$$;

CREATE OR REPLACE FUNCTION public.mask_document(doc text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE 
    WHEN doc IS NULL OR doc = '' THEN ''
    WHEN length(doc) <= 4 THEN repeat('*', length(doc))
    ELSE left(doc, 2) || repeat('*', greatest(length(doc) - 4, 1)) || right(doc, 2)
  END;
$$;