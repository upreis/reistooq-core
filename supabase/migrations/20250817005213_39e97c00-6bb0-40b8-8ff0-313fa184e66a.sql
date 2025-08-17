-- DB HARDENING - Security Migration for profiles, historico_vendas, integration_secrets
-- PART A: Profiles (sensitive personal data)

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Base security for profiles
REVOKE ALL ON TABLE public.profiles FROM PUBLIC;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies (owner sees own record)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 4. Masking functions
CREATE OR REPLACE FUNCTION public.mask_email(txt text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN txt IS NULL THEN NULL
    ELSE regexp_replace(txt,'(^.).*(@.*$)','\1***\2')
  END
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(txt text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN txt IS NULL THEN NULL
    ELSE '****' || right(txt, 4)
  END
$$;

-- 5. Masked view for general use
DROP VIEW IF EXISTS public.profiles_safe CASCADE;
CREATE VIEW public.profiles_safe AS
SELECT
  id,
  nome_completo,
  nome_exibicao,
  public.mask_phone(telefone) AS telefone,
  cargo,
  departamento,
  organizacao_id,
  avatar_url,
  created_at,
  updated_at,
  onboarding_banner_dismissed,
  configuracoes_notificacao
FROM public.profiles;

GRANT SELECT ON public.profiles_safe TO authenticated;

-- PART B: Historico vendas (business/financial data)

-- Block direct access to base table
DROP POLICY IF EXISTS "hv_block_select" ON public.historico_vendas;
CREATE POLICY "hv_block_select"
ON public.historico_vendas
FOR ALL
USING (false);

-- Safe view without sensitive data (PII already masked by existing function)
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;
CREATE VIEW public.historico_vendas_safe AS
SELECT
  id,
  id_unico,
  numero_pedido,
  sku_produto,
  descricao,
  quantidade,
  valor_unitario,
  valor_total,
  status,
  observacoes,
  data_pedido,
  created_at,
  updated_at,
  ncm,
  codigo_barras,
  pedido_id,
  valor_frete,
  data_prevista,
  obs,
  obs_interna,
  cidade,
  uf,
  url_rastreamento,
  situacao,
  codigo_rastreamento,
  numero_ecommerce,
  valor_desconto,
  numero_venda,
  sku_estoque,
  sku_kit,
  qtd_kit,
  total_itens
FROM public.historico_vendas hv
JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
WHERE ia.organization_id = public.get_current_org_id();

GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- PART C: Integration secrets (API keys/tokens)

-- Add encrypted payload column
ALTER TABLE public.integration_secrets
  ADD COLUMN IF NOT EXISTS secret_enc bytea;

-- Block direct access to secrets table
DROP POLICY IF EXISTS "intsec_block_clients" ON public.integration_secrets;
CREATE POLICY "intsec_block_clients"
ON public.integration_secrets
FOR ALL
USING (false);

-- Function to encrypt secrets (called by Edge Functions)
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
  -- Build secret payload
  secret_data := jsonb_build_object(
    'client_id', p_client_id,
    'client_secret', p_client_secret,
    'access_token', p_access_token,
    'refresh_token', p_refresh_token,
    'expires_at', p_expires_at,
    'payload', p_payload
  );

  -- Insert/Update with encryption
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

-- Function to decrypt secrets (called by Edge Functions only)
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

-- Revoke permissions from authenticated users
REVOKE ALL ON FUNCTION public.encrypt_integration_secret FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrypt_integration_secret FROM PUBLIC;