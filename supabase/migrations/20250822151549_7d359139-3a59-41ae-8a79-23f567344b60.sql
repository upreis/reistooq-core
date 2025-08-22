-- Fix RPCs for integration secrets: align with table schema and encryption method
-- Guard to service_role, avoid leaking secrets

-- Decrypt function (keeps same signature used by edge functions)
CREATE OR REPLACE FUNCTION public.decrypt_integration_secret(
  p_account_id text,
  p_provider text,
  p_encryption_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plain jsonb;
BEGIN
  -- Allow only service role to call
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT extensions.pgp_sym_decrypt(s.secret_enc, p_encryption_key)::jsonb
    INTO v_plain
  FROM public.integration_secrets s
  WHERE s.integration_account_id = p_account_id::uuid
    AND s.provider = p_provider;

  IF NOT FOUND OR v_plain IS NULL THEN
    RAISE EXCEPTION 'integration secret not found or could not be decrypted';
  END IF;

  -- Best-effort audit
  BEGIN
    PERFORM public.log_secret_access(p_account_id::uuid, p_provider, 'decrypt', 'rpc.decrypt_integration_secret', true, NULL);
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN v_plain;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    PERFORM public.log_secret_access(p_account_id::uuid, p_provider, 'decrypt', 'rpc.decrypt_integration_secret', false, SQLERRM);
  EXCEPTION WHEN OTHERS THEN NULL; END;
  RAISE;
END;
$$;

-- Encrypt/Upsert function (used by store-secret and token refresh flows)
CREATE OR REPLACE FUNCTION public.encrypt_integration_secret(
  p_account_id uuid,
  p_provider text,
  p_encryption_key text,
  p_secret jsonb,
  p_expires_at timestamptz DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_enc bytea;
  v_id uuid;
  v_org uuid;
BEGIN
  -- Allow only service role to call
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT organization_id INTO v_org
  FROM public.integration_accounts
  WHERE id = p_account_id;

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'integration account not found';
  END IF;

  v_enc := extensions.pgp_sym_encrypt(p_secret::text, p_encryption_key);

  -- Try update first
  UPDATE public.integration_secrets s
  SET secret_enc = v_enc,
      expires_at = p_expires_at,
      payload = COALESCE(p_payload, '{}'::jsonb),
      organization_id = v_org,
      updated_at = now()
  WHERE s.integration_account_id = p_account_id
    AND s.provider = p_provider
  RETURNING s.id INTO v_id;

  IF v_id IS NULL THEN
    INSERT INTO public.integration_secrets (
      integration_account_id, provider, organization_id, secret_enc, expires_at, payload, created_at, updated_at
    ) VALUES (
      p_account_id, p_provider, v_org, v_enc, p_expires_at, COALESCE(p_payload, '{}'::jsonb), now(), now()
    )
    RETURNING id INTO v_id;
  END IF;

  -- Best-effort audit
  BEGIN
    PERFORM public.log_secret_access(p_account_id, p_provider, 'encrypt', 'rpc.encrypt_integration_secret', true, NULL);
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN v_id;
END;
$$;

-- Helpful index for lookups (non-unique to avoid conflicts with existing data)
CREATE INDEX IF NOT EXISTS idx_integration_secrets_account_provider
  ON public.integration_secrets (integration_account_id, provider);
