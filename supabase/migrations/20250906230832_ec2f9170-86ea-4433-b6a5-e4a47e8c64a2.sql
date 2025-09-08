-- Drop existing views completely to avoid column name conflicts, then recreate with proper order

DROP VIEW IF EXISTS public.clientes_safe CASCADE;
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;

-- Create entirely new safe views with correct column ordering
CREATE VIEW public.clientes_safe AS
SELECT 
  c.id,
  public.mask_name(c.nome_completo)        AS nome_completo,
  public.mask_email(c.email)               AS email,
  public.mask_phone_secure(c.telefone)     AS telefone,
  public.mask_document(c.cpf_cnpj)         AS cpf_cnpj,
  c.endereco_rua,
  c.endereco_numero,
  c.endereco_bairro,
  c.endereco_cidade,
  c.endereco_uf,
  c.endereco_cep,
  c.status_cliente,
  c.observacoes,
  c.empresa,
  c.ticket_medio,
  c.valor_total_gasto,
  c.total_pedidos,
  c.data_ultimo_pedido,
  c.data_primeiro_pedido,
  c.created_at,
  c.updated_at,
  c.organization_id,
  c.integration_account_id
FROM public.clientes c
WHERE c.organization_id = public.get_current_org_id();

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
  hv.total_itens,
  public.mask_name(hv.cliente_nome)        AS cliente_nome,
  public.mask_document(hv.cliente_documento) AS cliente_documento,
  public.mask_name(hv.nome_completo)       AS nome_completo,
  public.mask_document(hv.cpf_cnpj)        AS cpf_cnpj,
  hv.integration_account_id
FROM public.historico_vendas hv
JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
WHERE ia.organization_id = public.get_current_org_id();

-- Grant permissions
GRANT SELECT ON public.clientes_safe TO authenticated;
GRANT SELECT ON public.historico_vendas_safe TO authenticated;