-- SECURITY FIX: Properly secure historico_vendas_safe view
-- Ensure it inherits security from underlying table and has proper access controls

-- 1) Remove any existing public/anon access from the view
REVOKE ALL ON public.historico_vendas_safe FROM PUBLIC, anon;

-- 2) Grant controlled access only to authenticated users
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- 3) Ensure the view has proper security options (already set but let's verify)
ALTER VIEW public.historico_vendas_safe 
  SET (security_invoker = true, security_barrier = true);

-- 4) Since the view should rely on the underlying table's RLS and the secure function,
-- let's recreate the view to ensure it properly filters by organization
DROP VIEW IF EXISTS public.historico_vendas_safe;

-- 5) Create a secure view that uses the existing get_historico_vendas_masked function
-- This ensures proper organization filtering and PII masking
CREATE VIEW public.historico_vendas_safe
WITH (security_invoker = true, security_barrier = true)
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
  -- Always mask customer information for privacy
  public.mask_name(hv.cliente_nome) as cliente_nome,
  public.mask_document(hv.cliente_documento) as cliente_documento,
  hv.status,
  hv.observacoes,
  hv.data_pedido,
  hv.created_at,
  hv.updated_at,
  hv.ncm,
  hv.codigo_barras,
  hv.pedido_id,
  public.mask_document(hv.cpf_cnpj) as cpf_cnpj,
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

-- 6) Set proper grants on the new view
REVOKE ALL ON public.historico_vendas_safe FROM PUBLIC, anon;
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- 7) Ensure default privileges don't grant public access to future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  REVOKE ALL ON TABLES FROM PUBLIC, anon;