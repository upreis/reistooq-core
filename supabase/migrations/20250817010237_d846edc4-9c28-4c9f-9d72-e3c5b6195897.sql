-- PROFILES ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.mask_phone(txt text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN txt IS NULL THEN NULL ELSE '****' || right(txt, 4) END
$$;

DROP VIEW IF EXISTS public.profiles_safe CASCADE;
CREATE VIEW public.profiles_safe AS
SELECT
  p.id,
  p.nome_completo,
  p.nome_exibicao,
  public.mask_phone(p.telefone) AS telefone,
  p.cargo,
  p.departamento,
  p.organizacao_id,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  p.onboarding_banner_dismissed,
  p.configuracoes_notificacao
FROM public.profiles p;

GRANT SELECT ON public.profiles_safe TO authenticated;

-- HISTORICO_VENDAS ────────────────────────────────────────────────────────
REVOKE ALL ON TABLE public.historico_vendas FROM PUBLIC;
ALTER TABLE public.historico_vendas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hv_block_select ON public.historico_vendas;
CREATE POLICY hv_block_select
ON public.historico_vendas
FOR SELECT
USING (false);

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

-- INTEGRATION_SECRETS ─────────────────────────────────────────────────────
ALTER TABLE public.integration_secrets
  ADD COLUMN IF NOT EXISTS secret_enc bytea;

ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "intsec_block_clients" ON public.integration_secrets;
CREATE POLICY "intsec_block_clients"
ON public.integration_secrets
FOR ALL
USING (false);

-- limpar campos legados em texto claro
UPDATE public.integration_secrets
SET client_secret = NULL,
    access_token  = NULL,
    refresh_token = NULL;

-- trigger para impedir re-preenchimento dos campos legados
CREATE OR REPLACE FUNCTION public.integration_secrets_legacy_nullify()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.client_secret := NULL;
  NEW.access_token  := NULL;
  NEW.refresh_token := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_intsec_legacy_nullify ON public.integration_secrets;
CREATE TRIGGER trg_intsec_legacy_nullify
BEFORE INSERT OR UPDATE ON public.integration_secrets
FOR EACH ROW EXECUTE FUNCTION public.integration_secrets_legacy_nullify();

-- funções de criptografia (server-side only)
CREATE OR REPLACE FUNCTION public.encrypt_integration_secret(
  p_account_id uuid,
  p_provider text,
  p_client_id text DEFAULT NULL,
  p_client_secret text DEFAULT NULL,
  p_access_token text DEFAULT NULL,
  p_refresh_token text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_payload jsonb DEFAULT NULL,
  p_encryption_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_id uuid;
  secret_data jsonb;
BEGIN
  secret_data := jsonb_build_object(
    'client_id', p_client_id,
    'client_secret', p_client_secret,
    'access_token', p_access_token,
    'refresh_token', p_refresh_token,
    'expires_at', p_expires_at,
    'payload', p_payload
  );

  INSERT INTO public.integration_secrets (
    integration_account_id,
    provider,
    organization_id,
    secret_enc,
    created_at,
    updated_at
  ) VALUES (
    p_account_id,
    p_provider,
    public.get_current_org_id(),
    CASE 
      WHEN p_encryption_key IS NOT NULL 
      THEN pgp_sym_encrypt(secret_data::text, p_encryption_key)
      ELSE NULL
    END,
    now(),
    now()
  )
  ON CONFLICT (integration_account_id, provider) 
  DO UPDATE SET
    secret_enc = CASE 
      WHEN p_encryption_key IS NOT NULL 
      THEN pgp_sym_encrypt(secret_data::text, p_encryption_key)
      ELSE EXCLUDED.secret_enc
    END,
    updated_at = now()
  RETURNING id INTO secret_id;

  RETURN secret_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_integration_secret(
  p_account_id uuid, 
  p_provider text,
  p_encryption_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE 
  payload text;
BEGIN
  SELECT pgp_sym_decrypt(secret_enc, p_encryption_key) INTO payload
  FROM public.integration_secrets
  WHERE integration_account_id = p_account_id 
    AND provider = p_provider;

  RETURN COALESCE(payload::jsonb, '{}'::jsonb);
END;
$$;

-- harden functions
ALTER FUNCTION public.encrypt_integration_secret(
  uuid, text, text, text, text, text, timestamptz, jsonb, text
) SET search_path = public;

ALTER FUNCTION public.decrypt_integration_secret(
  uuid, text, text
) SET search_path = public;

REVOKE ALL ON FUNCTION public.encrypt_integration_secret FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrypt_integration_secret FROM PUBLIC;