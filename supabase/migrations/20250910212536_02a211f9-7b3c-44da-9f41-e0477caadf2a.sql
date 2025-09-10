-- Drop e recriar a função com todas as colunas

DROP FUNCTION IF EXISTS public.get_historico_vendas_browse(integer,integer,text,date,date);

-- Adicionar colunas faltantes na tabela historico_vendas para corresponder às colunas do /pedidos

-- Endereço completo
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS cep text;

-- Informações de produtos/SKUs
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS skus_produtos text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS quantidade_itens integer DEFAULT 0;

-- Informações de shipping/logística
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS delivery_type text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS substatus_detail text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS shipping_method text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS shipping_mode text;

-- Informações do Mercado Livre
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS date_created timestamp with time zone;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS pack_id text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS pickup_id text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS pack_status text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS pack_status_detail text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS tags text[];

-- Data de última atualização específica
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();

-- Recriar a função get_historico_vendas_browse com todas as colunas
CREATE OR REPLACE FUNCTION public.get_historico_vendas_browse(
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0,
  _search text DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  id_unico text,
  numero_pedido text,
  sku_produto text,
  descricao text,
  quantidade integer,
  valor_total numeric,
  cliente_nome text,
  nome_completo text,
  data_pedido date,
  status text,
  sku_estoque text,
  sku_kit text,
  quantidade_total integer,
  valor_pago numeric,
  frete_pago_cliente numeric,
  receita_flex_bonus numeric,
  custo_envio_seller numeric,
  desconto_cupom numeric,
  taxa_marketplace numeric,
  valor_liquido_vendedor numeric,
  status_pagamento text,
  metodo_pagamento text,
  tipo_pagamento text,
  cidade text,
  uf text,
  rua text,
  numero text,
  bairro text,
  cep text,
  cpf_cnpj text,
  empresa text,
  skus_produtos text,
  quantidade_itens integer,
  total_itens integer,
  qtd_kit integer,
  situacao text,
  status_envio text,
  status_baixa text,
  status_mapeamento text,
  logistic_mode_principal text,
  tipo_logistico text,
  tipo_metodo_envio text,
  substatus_estado_atual text,
  modo_envio_combinado text,
  metodo_envio_combinado text,
  delivery_type text,
  substatus_detail text,
  shipping_method text,
  shipping_mode text,
  titulo_produto text,
  valor_unitario numeric,
  valor_frete numeric,
  valor_desconto numeric,
  numero_ecommerce text,
  numero_venda text,
  data_prevista date,
  obs text,
  obs_interna text,
  codigo_rastreamento text,
  url_rastreamento text,
  codigo_barras text,
  ncm text,
  observacoes text,
  pedido_id text,
  date_created timestamp with time zone,
  pack_id text,
  pickup_id text,
  pack_status text,
  pack_status_detail text,
  tags text[],
  last_updated timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  ultima_atualizacao timestamp with time zone,
  integration_account_id uuid,
  created_by uuid,
  meta jsonb
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
    hv.valor_total,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cliente_nome ELSE public.mask_name(hv.cliente_nome) END AS cliente_nome,
    hv.nome_completo,
    hv.data_pedido,
    hv.status,
    hv.sku_estoque,
    hv.sku_kit,
    hv.quantidade_total,
    hv.valor_pago,
    hv.frete_pago_cliente,
    hv.receita_flex_bonus,
    hv.custo_envio_seller,
    hv.desconto_cupom,
    hv.taxa_marketplace,
    hv.valor_liquido_vendedor,
    hv.status_pagamento,
    hv.metodo_pagamento,
    hv.tipo_pagamento,
    hv.cidade,
    hv.uf,
    hv.rua,
    hv.numero,
    hv.bairro,
    hv.cep,
    CASE WHEN public.has_permission('vendas:view_pii') THEN hv.cpf_cnpj ELSE public.mask_name(hv.cpf_cnpj) END AS cpf_cnpj,
    hv.empresa,
    hv.skus_produtos,
    hv.quantidade_itens,
    hv.total_itens,
    hv.qtd_kit,
    hv.situacao,
    hv.status_envio,
    hv.status_baixa,
    hv.status_mapeamento,
    hv.logistic_mode_principal,
    hv.tipo_logistico,
    hv.tipo_metodo_envio,
    hv.substatus_estado_atual,
    hv.modo_envio_combinado,
    hv.metodo_envio_combinado,
    hv.delivery_type,
    hv.substatus_detail,
    hv.shipping_method,
    hv.shipping_mode,
    hv.titulo_produto,
    hv.valor_unitario,
    hv.valor_frete,
    hv.valor_desconto,
    hv.numero_ecommerce,
    hv.numero_venda,
    hv.data_prevista,
    hv.obs,
    hv.obs_interna,
    hv.codigo_rastreamento,
    hv.url_rastreamento,
    hv.codigo_barras,
    hv.ncm,
    hv.observacoes,
    hv.pedido_id,
    hv.date_created,
    hv.pack_id,
    hv.pickup_id,
    hv.pack_status,
    hv.pack_status_detail,
    hv.tags,
    hv.last_updated,
    hv.created_at,
    hv.updated_at,
    hv.ultima_atualizacao,
    hv.integration_account_id,
    hv.created_by,
    hv.meta
  FROM public.historico_vendas hv
  WHERE 
    (_search IS NULL OR (
      hv.numero_pedido ILIKE '%' || _search || '%' OR
      hv.sku_produto ILIKE '%' || _search || '%' OR
      hv.cliente_nome ILIKE '%' || _search || '%' OR
      hv.id_unico ILIKE '%' || _search || '%' OR
      hv.empresa ILIKE '%' || _search || '%'
    ))
    AND (_start IS NULL OR hv.data_pedido >= _start)
    AND (_end IS NULL OR hv.data_pedido <= _end)
  ORDER BY hv.created_at DESC
  LIMIT _limit
  OFFSET _offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_historico_vendas_browse TO authenticated;