-- 1) Convert masking functions to SECURITY INVOKER (no elevated privileges)

CREATE OR REPLACE FUNCTION public.mask_name(full_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  n text;
  parts text[];
BEGIN
  IF full_name IS NULL OR btrim(full_name) = '' THEN
    RETURN NULL;
  END IF;
  n := btrim(full_name);
  parts := regexp_split_to_array(n, '\\s+');
  IF array_length(parts, 1) = 1 THEN
    RETURN left(parts[1], 1) || '***';
  ELSE
    RETURN parts[1] || ' ' || left(parts[array_length(parts,1)], 1) || '.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(email_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  parts text[];
  username text;
  domain text;
BEGIN
  IF email_input IS NULL OR email_input = '' THEN
    RETURN NULL;
  END IF;
  parts := string_to_array(email_input, '@');
  IF array_length(parts, 1) <> 2 THEN
    RETURN '***@***.com';
  END IF;
  username := parts[1];
  domain := parts[2];
  RETURN left(username, 1) || '***@' || domain;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_document(doc text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  digits text;
  len int;
BEGIN
  IF doc IS NULL OR btrim(doc) = '' THEN
    RETURN NULL;
  END IF;
  digits := regexp_replace(doc, '\\D', '', 'g');
  len := length(digits);
  IF len <= 4 THEN
    RETURN repeat('*', GREATEST(len - 1, 0)) || right(digits, LEAST(len, 1));
  ELSIF len <= 11 THEN
    RETURN repeat('*', len - 2) || right(digits, 2);
  ELSE
    RETURN repeat('*', len - 4) || right(digits, 4);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone_secure(phone_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  IF phone_input IS NULL OR length(btrim(phone_input)) < 4 THEN
    RETURN '****';
  END IF;
  phone_input := regexp_replace(phone_input, '[^0-9]', '', 'g');
  RETURN '****' || right(phone_input, 4);
END;
$$;

-- 2) Drop SELECT policies on raw tables to force use of safe views only
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clientes' AND policyname='clientes_admin_only') THEN
    EXECUTE 'DROP POLICY "clientes_admin_only" ON public.clientes';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clientes' AND policyname='clientes_org_select_with_pii_perm') THEN
    EXECUTE 'DROP POLICY "clientes_org_select_with_pii_perm" ON public.clientes';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clientes' AND policyname='clientes_org_select_with_perms') THEN
    EXECUTE 'DROP POLICY "clientes_org_select_with_perms" ON public.clientes';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='historico_vendas' AND policyname='historico_admin_only') THEN
    EXECUTE 'DROP POLICY "historico_admin_only" ON public.historico_vendas';
  END IF;
END $$;

-- 3) Recreate clientes_safe without calling SECURITY DEFINER helpers
DROP VIEW IF EXISTS public.clientes_safe CASCADE;
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
WHERE EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = auth.uid() AND p.organizacao_id = c.organization_id
);

-- 4) historico_vendas_safe already avoids get_current_org_id; just ensure it exists
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
  hv.total_itens,
  public.mask_name(hv.cliente_nome)        AS cliente_nome,
  public.mask_document(hv.cliente_documento) AS cliente_documento,
  public.mask_name(hv.nome_completo)       AS nome_completo,
  public.mask_document(hv.cpf_cnpj)        AS cpf_cnpj,
  hv.integration_account_id
FROM public.historico_vendas hv
JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
JOIN public.profiles p ON p.organizacao_id = ia.organization_id
WHERE p.id = auth.uid();

-- 5) Permissions: block raw tables, allow safe views
REVOKE ALL ON TABLE public.clientes FROM PUBLIC;
REVOKE ALL ON TABLE public.historico_vendas FROM PUBLIC;
REVOKE ALL ON TABLE public.clientes_safe FROM PUBLIC;
REVOKE ALL ON TABLE public.historico_vendas_safe FROM PUBLIC;
GRANT SELECT ON public.clientes_safe TO authenticated;
GRANT SELECT ON public.historico_vendas_safe TO authenticated;