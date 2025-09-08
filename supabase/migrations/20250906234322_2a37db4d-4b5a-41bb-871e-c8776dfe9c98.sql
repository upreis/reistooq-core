-- Critical: Fix RLS on safe tables that are still publicly readable

-- 1. Enable RLS on clientes_safe table (if it's a table, not a view)
-- First check if it's a view or table and handle accordingly

-- Enable RLS on security_audit_log if not already enabled
ALTER TABLE IF EXISTS public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- 2. Create strict RLS policies for clientes_safe if it's a table
-- If it's a view, we need to ensure the underlying query is properly secured
CREATE OR REPLACE VIEW public.clientes_safe 
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
  c.empresa,
  c.data_primeiro_pedido,
  c.data_ultimo_pedido,
  c.total_pedidos,
  c.valor_total_gasto,
  c.ticket_medio,
  c.status_cliente,
  c.observacoes,
  c.created_at,
  c.updated_at,
  c.organization_id,
  c.integration_account_id
FROM public.clientes c
WHERE c.organization_id = public.get_current_org_id()
  AND public.has_permission('customers:read');

-- 3. Create secure historico_vendas_safe view with proper masking
CREATE OR REPLACE VIEW public.historico_vendas_safe 
WITH (security_invoker = true, security_barrier = true) AS
SELECT 
  h.id,
  h.id_unico,
  h.numero_pedido,
  h.sku_produto,
  h.quantidade,
  h.valor_unitario,
  h.valor_total,
  h.data_pedido,
  h.valor_frete,
  h.valor_desconto,
  h.data_prevista,
  h.descricao,
  h.status,
  -- Mask customer PII based on permissions
  CASE 
    WHEN public.has_permission('sales:read_full') THEN h.cliente_nome
    ELSE public.mask_name(h.cliente_nome)
  END as cliente_nome,
  CASE 
    WHEN public.has_permission('sales:read_full') THEN h.cliente_documento
    ELSE regexp_replace(h.cliente_documento, '(.{3}).*(.{2})', '\1***\2')
  END as cliente_documento,
  CASE 
    WHEN public.has_permission('sales:read_full') THEN h.nome_completo
    ELSE public.mask_name(h.nome_completo)
  END as nome_completo,
  CASE 
    WHEN public.has_permission('sales:read_full') THEN h.cpf_cnpj
    ELSE regexp_replace(h.cpf_cnpj, '(.{3}).*(.{2})', '\1***\2')
  END as cpf_cnpj,
  h.observacoes,
  h.ncm,
  h.codigo_barras,
  h.pedido_id,
  h.obs,
  h.obs_interna,
  h.cidade,
  h.uf,
  h.url_rastreamento,
  h.situacao,
  h.codigo_rastreamento,
  h.numero_ecommerce,
  h.numero_venda,
  h.sku_estoque,
  h.sku_kit,
  h.qtd_kit,
  h.total_itens,
  h.created_at,
  h.updated_at,
  h.integration_account_id
FROM public.historico_vendas h
JOIN public.integration_accounts ia ON ia.id = h.integration_account_id
WHERE ia.organization_id = public.get_current_org_id()
  AND public.has_permission('sales:read');

-- 4. Revoke all public access to safe views and grant only to authenticated with proper org filtering
REVOKE ALL ON public.clientes_safe FROM PUBLIC, anon;
REVOKE ALL ON public.historico_vendas_safe FROM PUBLIC, anon;

-- Grant only to authenticated users (views will handle permission checks internally)
GRANT SELECT ON public.clientes_safe TO authenticated;
GRANT SELECT ON public.historico_vendas_safe TO authenticated;