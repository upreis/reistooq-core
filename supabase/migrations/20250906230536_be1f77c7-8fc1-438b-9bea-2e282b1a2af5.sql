-- Harden PII access for clientes and historico_vendas and provide masked, org-scoped safe views

-- 1) Ensure permissions exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_permissions WHERE key = 'customers:view_pii') THEN
    INSERT INTO public.app_permissions (key, name, description)
    VALUES ('customers:view_pii', 'Ver PII de clientes', 'Permite ver dados pessoais sem máscara na tabela clientes');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.app_permissions WHERE key = 'vendas:view_pii') THEN
    INSERT INTO public.app_permissions (key, name, description)
    VALUES ('vendas:view_pii', 'Ver PII de histórico de vendas', 'Permite ver dados pessoais sem máscara na tabela historico_vendas');
  END IF;
END $$;

-- 2) CLIENTES: restrict direct SELECT to strong permission and provide masked view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'clientes' AND policyname = 'clientes_org_select_with_perms'
  ) THEN
    EXECUTE 'DROP POLICY "clientes_org_select_with_perms" ON public.clientes';
  END IF;
END $$;

CREATE POLICY "clientes_org_select_with_pii_perm"
ON public.clientes
FOR SELECT
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('customers:view_pii')
);

-- Safe view with masking and org filter
CREATE OR REPLACE VIEW public.clientes_safe AS
SELECT 
  c.id,
  c.organization_id,
  c.integration_account_id,
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
  c.updated_at
FROM public.clientes c
WHERE c.organization_id = public.get_current_org_id();

REVOKE ALL ON TABLE public.clientes FROM PUBLIC;
REVOKE ALL ON TABLE public.clientes_safe FROM PUBLIC;
GRANT SELECT ON public.clientes_safe TO authenticated;

-- 3) HISTORICO_VENDAS: restrict direct SELECT and expose masked view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'historico_vendas' AND policyname = 'hv_select_own'
  ) THEN
    EXECUTE 'DROP POLICY "hv_select_own" ON public.historico_vendas';
  END IF;
END $$;

CREATE POLICY "hv_select_org_with_pii_perm"
ON public.historico_vendas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.integration_accounts ia
    WHERE ia.id = historico_vendas.integration_account_id
      AND ia.organization_id = public.get_current_org_id()
  )
  AND public.has_permission('vendas:view_pii')
);

-- Safe view with masking and org filter via join
CREATE OR REPLACE VIEW public.historico_vendas_safe AS
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
  public.mask_name(hv.cliente_nome)     AS cliente_nome,
  public.mask_document(hv.cliente_documento) AS cliente_documento,
  public.mask_name(hv.nome_completo)    AS nome_completo,
  public.mask_document(hv.cpf_cnpj)     AS cpf_cnpj,
  hv.integration_account_id
FROM public.historico_vendas hv
JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
WHERE ia.organization_id = public.get_current_org_id();

REVOKE ALL ON TABLE public.historico_vendas FROM PUBLIC;
REVOKE ALL ON TABLE public.historico_vendas_safe FROM PUBLIC;
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- 4) Guidance comment
COMMENT ON VIEW public.clientes_safe IS 'View com dados de clientes mascarados e filtrados por organização. Use esta view no frontend.';
COMMENT ON VIEW public.historico_vendas_safe IS 'View com dados de histórico de vendas mascarados e filtrados por organização. Use esta view no frontend.';