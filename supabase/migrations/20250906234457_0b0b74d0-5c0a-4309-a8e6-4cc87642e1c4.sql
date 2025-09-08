-- Drop and recreate views with proper security and correct column structure

DROP VIEW IF EXISTS public.clientes_safe CASCADE;
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;

-- Recreate clientes_safe with proper security and masking
CREATE VIEW public.clientes_safe 
WITH (security_invoker = true, security_barrier = true) AS
SELECT 
  c.id,
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.nome_completo
    ELSE public.mask_name(c.nome_completo)
  END as nome_completo,
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.email
    ELSE regexp_replace(c.email, '(.{2}).*(@.*)', '\1***\2')
  END as email,
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.telefone
    ELSE public.mask_phone(c.telefone)
  END as telefone,
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.cpf_cnpj
    ELSE regexp_replace(c.cpf_cnpj, '(.{3}).*(.{2})', '\1***\2')
  END as cpf_cnpj,
  c.endereco_rua,
  c.endereco_numero,
  c.endereco_bairro,
  c.endereco_cidade,
  c.endereco_uf,
  c.endereco_cep,
  c.status_cliente,
  c.observacoes,
  c.ticket_medio,
  c.valor_total_gasto,
  c.total_pedidos,
  c.data_ultimo_pedido,
  c.data_primeiro_pedido,
  c.created_at,
  c.updated_at,
  c.organization_id,
  c.integration_account_id,
  c.empresa
FROM public.clientes c
WHERE c.organization_id = public.get_current_org_id()
  AND public.has_permission('customers:read');

-- Recreate historico_vendas_safe with proper security and masking  
CREATE VIEW public.historico_vendas_safe 
WITH (security_invoker = true, security_barrier = true) AS
SELECT 
  h.id,
  h.id_unico,
  h.quantidade,
  h.valor_unitario,
  h.valor_total,
  h.data_pedido,
  h.numero_pedido,
  h.created_at,
  h.updated_at,
  h.sku_produto,
  h.valor_frete,
  h.data_prevista,
  CASE 
    WHEN public.has_permission('sales:read_full') THEN h.cpf_cnpj
    ELSE regexp_replace(h.cpf_cnpj, '(.{3}).*(.{2})', '\1***\2')
  END as cpf_cnpj,
  h.descricao,
  h.status,
  CASE 
    WHEN public.has_permission('sales:read_full') THEN h.nome_completo
    ELSE public.mask_name(h.nome_completo)
  END as nome_completo,
  CASE 
    WHEN public.has_permission('sales:read_full') THEN h.cliente_documento
    ELSE regexp_replace(h.cliente_documento, '(.{3}).*(.{2})', '\1***\2')
  END as cliente_documento,
  CASE 
    WHEN public.has_permission('sales:read_full') THEN h.cliente_nome
    ELSE public.mask_name(h.cliente_nome)
  END as cliente_nome,
  h.observacoes,
  h.valor_desconto,
  h.ncm,
  h.codigo_barras,
  h.pedido_id,
  h.obs,
  h.obs_interna,
  h.cidade,
  h.uf,
  h.url_rastreamento,
  h.situacao,
  h.sku_estoque,
  h.numero_ecommerce,
  h.total_itens,
  h.codigo_rastreamento,
  h.numero_venda,
  h.sku_kit,
  h.qtd_kit,
  h.integration_account_id
FROM public.historico_vendas h
JOIN public.integration_accounts ia ON ia.id = h.integration_account_id
WHERE ia.organization_id = public.get_current_org_id()
  AND public.has_permission('sales:read');

-- Secure the views - revoke public access and grant only to authenticated
REVOKE ALL ON public.clientes_safe FROM PUBLIC, anon;
REVOKE ALL ON public.historico_vendas_safe FROM PUBLIC, anon;
GRANT SELECT ON public.clientes_safe TO authenticated;
GRANT SELECT ON public.historico_vendas_safe TO authenticated;