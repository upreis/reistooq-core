-- Adicionar novas colunas na tabela historico_vendas baseadas nas imagens
-- e recriar a função get_historico_vendas_masked com as novas colunas

-- Adicionar novas colunas
ALTER TABLE public.historico_vendas 
ADD COLUMN IF NOT EXISTS empresa text,
ADD COLUMN IF NOT EXISTS nome_completo text,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS quantidade_total integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS titulo_produto text,
ADD COLUMN IF NOT EXISTS valor_pago numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS frete_pago_cliente numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS receita_flex_bonus numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_envio_seller numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto_cupom numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS taxa_marketplace numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_liquido_vendedor numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS metodo_pagamento text,
ADD COLUMN IF NOT EXISTS status_pagamento text,
ADD COLUMN IF NOT EXISTS tipo_pagamento text,
ADD COLUMN IF NOT EXISTS status_mapeamento text,
ADD COLUMN IF NOT EXISTS quantidade_kit integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS status_baixa text,
ADD COLUMN IF NOT EXISTS status_envio text,
ADD COLUMN IF NOT EXISTS logistic_mode_principal text,
ADD COLUMN IF NOT EXISTS tipo_logistico text,
ADD COLUMN IF NOT EXISTS tipo_metodo_envio text,
ADD COLUMN IF NOT EXISTS tipo_entrega text,
ADD COLUMN IF NOT EXISTS substatus_estado_atual text,
ADD COLUMN IF NOT EXISTS modo_envio_combinado text,
ADD COLUMN IF NOT EXISTS metodo_envio_combinado text;

-- Recriar a função com as novas colunas
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(_start date, _end date, _search text, _limit integer, _offset integer);

CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked(
  _start date DEFAULT NULL::date, 
  _end date DEFAULT NULL::date, 
  _search text DEFAULT NULL::text, 
  _limit integer DEFAULT 100, 
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  -- Básicas (obrigatórias)
  id uuid,
  id_unico text,
  empresa text,
  numero_pedido text,
  nome_cliente text,
  nome_completo text,
  data_pedido date,
  ultima_atualizacao timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  
  -- Produtos
  sku_produto text,
  quantidade_total integer,
  titulo_produto text,
  
  -- Financeiras
  valor_total numeric,
  valor_pago numeric,
  frete_pago_cliente numeric,
  receita_flex_bonus numeric,
  custo_envio_seller numeric,
  desconto_cupom numeric,
  taxa_marketplace numeric,
  valor_liquido_vendedor numeric,
  metodo_pagamento text,
  status_pagamento text,
  tipo_pagamento text,
  
  -- Mapeamento
  status_mapeamento text,
  sku_estoque text,
  sku_kit text,
  quantidade_kit integer,
  total_itens integer,
  status_baixa text,
  
  -- Envio
  status_envio text,
  logistic_mode_principal text,
  tipo_logistico text,
  tipo_metodo_envio text,
  tipo_entrega text,
  substatus_estado_atual text,
  modo_envio_combinado text,
  metodo_envio_combinado text
) 
LANGUAGE SQL 
STABLE SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 
    -- Básicas (obrigatórias)
    hv.id,
    hv.id_unico,
    hv.empresa,
    hv.numero_pedido,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cliente_nome ELSE public.mask_name(hv.cliente_nome) END,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.nome_completo ELSE public.mask_name(hv.nome_completo) END,
    hv.data_pedido,
    hv.ultima_atualizacao,
    hv.created_at,
    hv.updated_at,
    
    -- Produtos
    hv.sku_produto,
    hv.quantidade_total,
    hv.titulo_produto,
    
    -- Financeiras
    hv.valor_total,
    hv.valor_pago,
    hv.frete_pago_cliente,
    hv.receita_flex_bonus,
    hv.custo_envio_seller,
    hv.desconto_cupom,
    hv.taxa_marketplace,
    hv.valor_liquido_vendedor,
    hv.metodo_pagamento,
    hv.status_pagamento,
    hv.tipo_pagamento,
    
    -- Mapeamento
    hv.status_mapeamento,
    hv.sku_estoque,
    hv.sku_kit,
    hv.quantidade_kit,
    hv.total_itens,
    hv.status_baixa,
    
    -- Envio
    hv.status_envio,
    hv.logistic_mode_principal,
    hv.tipo_logistico,
    hv.tipo_metodo_envio,
    hv.tipo_entrega,
    hv.substatus_estado_atual,
    hv.modo_envio_combinado,
    hv.metodo_envio_combinado
    
  FROM public.historico_vendas hv
  JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
  WHERE ia.organization_id = public.get_current_org_id()
    AND (public.has_permission('historico:view') OR public.has_permission('vendas:read'))
    AND (_start IS NULL OR hv.data_pedido >= _start)
    AND (_end IS NULL OR hv.data_pedido <= _end)
    AND (
      _search IS NULL OR _search = '' OR
      hv.numero_pedido ILIKE '%' || _search || '%' OR
      hv.sku_produto ILIKE '%' || _search || '%' OR
      hv.titulo_produto ILIKE '%' || _search || '%' OR
      hv.cliente_nome ILIKE '%' || _search || '%'
    )
  ORDER BY hv.data_pedido DESC, hv.created_at DESC
  LIMIT COALESCE(_limit, 100) OFFSET COALESCE(_offset, 0);
$$;