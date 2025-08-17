-- Create historico_vendas_safe view
-- Safe view without sensitive data (using existing masked function)
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;
CREATE VIEW public.historico_vendas_safe AS
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
  hv.total_itens
FROM public.historico_vendas hv
JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
WHERE ia.organization_id = public.get_current_org_id();

GRANT SELECT ON public.historico_vendas_safe TO authenticated;