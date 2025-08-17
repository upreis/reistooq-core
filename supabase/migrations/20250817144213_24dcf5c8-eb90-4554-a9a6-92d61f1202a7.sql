-- =============== SECURITY HARDENING FIXES ===============
-- Fix 4 critical security issues: Profiles exposed, Business data exposed, 
-- Function search path mutable, Extension in public

-- =============== 1. PROFILES SECURITY ===============
-- Revoke public access and enable RLS
REVOKE ALL ON TABLE public.profiles FROM PUBLIC;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create secure policy for own profile access only
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create secure view with phone masking function
CREATE OR REPLACE FUNCTION public.mask_phone(txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN txt IS NULL THEN NULL ELSE '****' || right(txt, 4) END
$$;

-- Create profiles safe view for organization data
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
FROM public.profiles p
WHERE p.organizacao_id = (
  SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
);

-- Grant access to the safe view
GRANT SELECT ON public.profiles_safe TO authenticated;

-- =============== 2. HISTORICO_VENDAS SECURITY ===============
-- Block direct table access
ALTER TABLE public.historico_vendas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hv_block_select ON public.historico_vendas;
CREATE POLICY hv_block_select
ON public.historico_vendas
FOR SELECT
USING (false); -- No direct access to sensitive sales data

-- Create secure view filtered by organization
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;
CREATE VIEW public.historico_vendas_safe AS
SELECT
  hv.id, hv.id_unico, hv.numero_pedido, hv.sku_produto, hv.descricao,
  hv.quantidade, hv.valor_unitario, hv.valor_total, hv.status, hv.observacoes,
  hv.data_pedido, hv.created_at, hv.updated_at, hv.ncm, hv.codigo_barras,
  hv.pedido_id, hv.valor_frete, hv.data_prevista, hv.obs, hv.obs_interna,
  hv.cidade, hv.uf, hv.url_rastreamento, hv.situacao, hv.codigo_rastreamento,
  hv.numero_ecommerce, hv.valor_desconto, hv.numero_venda, hv.sku_estoque,
  hv.sku_kit, hv.qtd_kit, hv.total_itens
FROM public.historico_vendas hv
JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
WHERE ia.organization_id = public.get_current_org_id();

-- Grant access to the safe view
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- =============== 3. FIX FUNCTION SEARCH PATHS ===============
-- Fix encrypt/decrypt functions search path for security
ALTER FUNCTION public.encrypt_integration_secret(uuid, text, text, text, text, text, timestamptz, jsonb, text) 
SET search_path = public, pg_temp;

ALTER FUNCTION public.decrypt_integration_secret(uuid, text, text) 
SET search_path = public, pg_temp;

-- Revoke public access to encryption functions
REVOKE ALL ON FUNCTION public.encrypt_integration_secret(uuid, text, text, text, text, text, timestamptz, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrypt_integration_secret(uuid, text, text) FROM PUBLIC;

-- =============== 4. MOVE PGCRYPTO TO EXTENSIONS SCHEMA ===============
-- Create extensions schema and move pgcrypto
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pgcrypto extension to proper schema
DO $$
BEGIN
  -- Try to move extension if it exists in public
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  ELSE
    -- Create in extensions schema if doesn't exist
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
  END IF;
END $$;

-- Update function to reference pgcrypto from extensions schema
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
SET search_path = public, extensions, pg_temp
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
      THEN extensions.pgp_sym_encrypt(secret_data::text, p_encryption_key)
      ELSE NULL
    END,
    now(),
    now()
  )
  ON CONFLICT (integration_account_id, provider) 
  DO UPDATE SET
    secret_enc = CASE 
      WHEN p_encryption_key IS NOT NULL 
      THEN extensions.pgp_sym_encrypt(secret_data::text, p_encryption_key)
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
SET search_path = public, extensions, pg_temp
AS $$
DECLARE 
  payload text;
BEGIN
  SELECT extensions.pgp_sym_decrypt(secret_enc, p_encryption_key) INTO payload
  FROM public.integration_secrets
  WHERE integration_account_id = p_account_id 
    AND provider = p_provider;

  RETURN COALESCE(payload::jsonb, '{}'::jsonb);
END;
$$;

-- Create secure RPC for profiles that uses safe view
CREATE OR REPLACE FUNCTION public.get_profiles_safe()
RETURNS TABLE(
  id uuid,
  nome_completo text,
  nome_exibicao text,
  telefone text,
  cargo text,
  departamento text,
  organizacao_id uuid,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  onboarding_banner_dismissed boolean,
  configuracoes_notificacao jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    p.id,
    p.nome_completo,
    p.nome_exibicao,
    p.telefone, -- Already masked in view
    p.cargo,
    p.departamento,
    p.organizacao_id,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.onboarding_banner_dismissed,
    p.configuracoes_notificacao
  FROM public.profiles_safe p;
$$;

-- Security comment
COMMENT ON SCHEMA public IS 'Security hardening applied - profiles secured, business data protected, functions fixed, pgcrypto moved to extensions';