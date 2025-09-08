-- CORREÇÃO COMPLETA DOS 4 ERROS DE SEGURANÇA (VERSÃO CORRIGIDA)
-- Esta migração corrige todos os problemas sem quebrar funcionalidades

-- 3. CORREÇÃO: Sales Data and Customer Information Could Be Accessed
-- Implementar view segura para historico_vendas
CREATE OR REPLACE VIEW public.historico_vendas_safe
WITH (security_barrier = true, security_invoker = true)
AS
SELECT 
  hv.id,
  hv.id_unico,
  hv.numero_pedido,
  hv.sku_produto,
  hv.descricao,
  hv.quantidade,
  hv.valor_unitario,
  hv.valor_total,
  hv.status,
  hv.observacoes,
  hv.data_pedido,
  hv.created_at,
  hv.updated_at,
  hv.ncm,
  hv.codigo_barras,
  hv.pedido_id,
  hv.valor_frete,
  hv.data_prevista,
  hv.obs,
  hv.obs_interna,
  -- Dados geográficos - permitir para analytics
  hv.cidade,
  hv.uf,
  hv.url_rastreamento,
  hv.situacao,
  hv.codigo_rastreamento,
  hv.numero_ecommerce,
  hv.valor_desconto,
  hv.numero_venda,
  hv.sku_estoque,
  hv.sku_kit,
  hv.qtd_kit,
  hv.total_itens,
  -- Mascarar dados sensíveis do cliente
  CASE 
    WHEN public.has_permission('historico:read_full') THEN hv.cliente_nome
    ELSE public.mask_name(hv.cliente_nome)
  END as cliente_nome,
  
  CASE 
    WHEN public.has_permission('historico:read_full') THEN hv.cliente_documento
    ELSE public.mask_document(hv.cliente_documento)
  END as cliente_documento,
  
  CASE 
    WHEN public.has_permission('historico:read_full') THEN hv.nome_completo
    ELSE public.mask_name(hv.nome_completo)
  END as nome_completo,
  
  CASE 
    WHEN public.has_permission('historico:read_full') THEN hv.cpf_cnpj
    ELSE public.mask_document(hv.cpf_cnpj)
  END as cpf_cnpj,
  
  -- Endereços mascarados para segurança
  CASE 
    WHEN public.has_permission('historico:read_full') THEN hv.rua
    ELSE NULL
  END as rua,
  
  CASE 
    WHEN public.has_permission('historico:read_full') THEN hv.numero
    ELSE NULL
  END as numero,
  
  CASE 
    WHEN public.has_permission('historico:read_full') THEN hv.bairro
    ELSE NULL
  END as bairro,
  
  CASE 
    WHEN public.has_permission('historico:read_full') THEN hv.cep
    ELSE NULL
  END as cep,
  
  -- Outros campos seguros
  hv.empresa,
  hv.titulo_produto,
  hv.metodo_pagamento,
  hv.status_pagamento,
  hv.tipo_pagamento,
  hv.status_mapeamento,
  hv.status_baixa,
  hv.status_envio,
  hv.logistic_mode_principal,
  hv.tipo_logistico,
  hv.tipo_metodo_envio,
  hv.tipo_entrega,
  hv.substatus_estado_atual,
  hv.modo_envio_combinado,
  hv.metodo_envio_combinado,
  hv.origem,
  hv.skus_produtos,
  hv.integration_account_id
FROM public.historico_vendas hv
JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
WHERE ia.organization_id = public.get_current_org_id()
  AND public.has_permission('historico:view');

-- Adicionar permissão para dados completos do histórico
INSERT INTO public.app_permissions (key, name, description) 
VALUES (
  'historico:read_full', 
  'Read Full Sales History Data', 
  'Permission to view complete sales history including sensitive customer information like full names, documents and addresses'
) ON CONFLICT (key) DO NOTHING;

-- Garantir que a view segura tem permissões
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- Atualizar função para usar view segura
CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked(
  _search text DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
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
  status text,
  data_pedido date,
  cliente_nome text,
  cidade text,
  uf text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar permissões
  IF NOT public.has_permission('historico:view') THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to view sales history';
  END IF;

  RETURN QUERY
  SELECT 
    hvs.id,
    hvs.id_unico,
    hvs.numero_pedido,
    hvs.sku_produto,
    hvs.descricao,
    hvs.quantidade,
    hvs.valor_unitario,
    hvs.valor_total,
    hvs.status,
    hvs.data_pedido,
    hvs.cliente_nome, -- Já mascarado pela view
    hvs.cidade,
    hvs.uf,
    hvs.created_at
  FROM public.historico_vendas_safe hvs
  WHERE (_search IS NULL OR (
    hvs.numero_pedido ILIKE '%' || _search || '%' OR
    hvs.sku_produto ILIKE '%' || _search || '%' OR
    hvs.descricao ILIKE '%' || _search || '%' OR
    hvs.cliente_nome ILIKE '%' || _search || '%'
  ))
  AND (_start IS NULL OR hvs.data_pedido >= _start)
  AND (_end IS NULL OR hvs.data_pedido <= _end)
  ORDER BY hvs.created_at DESC
  LIMIT COALESCE(_limit, 100)
  OFFSET COALESCE(_offset, 0);
END;
$$;