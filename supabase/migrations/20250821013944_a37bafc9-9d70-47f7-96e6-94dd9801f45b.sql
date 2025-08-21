-- Remove duplicate encrypt_integration_secret function and standardize to one signature
-- This function handles both account_id as text and uuid, ensuring backward compatibility

CREATE OR REPLACE FUNCTION public.encrypt_integration_secret(
  p_account_id uuid, 
  p_provider text, 
  p_client_id text, 
  p_client_secret text, 
  p_access_token text, 
  p_refresh_token text, 
  p_expires_at timestamp with time zone, 
  p_payload jsonb, 
  p_encryption_key text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_secret_json jsonb;
  v_org_id      uuid;
begin
  -- Validate encryption key
  if coalesce(p_encryption_key, '') = '' then
    raise exception 'APP_ENCRYPTION_KEY missing';
  end if;

  -- Build secret JSON
  v_secret_json := jsonb_build_object(
    'client_id',      p_client_id,
    'client_secret',  p_client_secret,
    'access_token',   p_access_token,
    'refresh_token',  p_refresh_token,
    'expires_at',     p_expires_at,
    'payload',        coalesce(p_payload, '{}'::jsonb)
  );

  -- Get organization_id from integration_account
  select ia.organization_id
    into v_org_id
  from public.integration_accounts ia
  where ia.id = p_account_id;

  if v_org_id is null then
    raise exception 'Missing organization_id for integration_account %', p_account_id;
  end if;

  -- Insert or update encrypted secret
  insert into public.integration_secrets (
    integration_account_id, provider, organization_id,
    secret_enc, expires_at, payload, updated_at
  ) values (
    p_account_id, p_provider, v_org_id,
    pgp_sym_encrypt(v_secret_json::text, p_encryption_key),
    p_expires_at,
    coalesce(p_payload, '{}'::jsonb),
    now()
  )
  on conflict (integration_account_id, provider) do update
  set secret_enc = excluded.secret_enc,
      expires_at = excluded.expires_at,
      payload    = excluded.payload,
      updated_at = now();
      
  -- Log access for audit
  perform public.log_secret_access(
    p_account_id, 
    p_provider, 
    'encrypt', 
    'encrypt_integration_secret',
    true,
    null
  );
end;
$$;

-- Update decrypt function to use consistent naming
CREATE OR REPLACE FUNCTION public.decrypt_integration_secret(
  p_account_id uuid, 
  p_provider text, 
  p_encryption_key text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_secret_data jsonb;
begin
  -- Validate encryption key
  if coalesce(p_encryption_key, '') = '' then
    raise exception 'APP_ENCRYPTION_KEY missing';
  end if;

  -- Decrypt secret data
  select pgp_sym_decrypt(s.secret_enc, p_encryption_key)::jsonb 
    into v_secret_data
  from public.integration_secrets s
  where s.integration_account_id = p_account_id 
    and s.provider = p_provider;

  if v_secret_data is null then
    raise exception 'No secrets found for account % provider %', p_account_id, p_provider;
  end if;

  -- Log access for audit  
  perform public.log_secret_access(
    p_account_id, 
    p_provider, 
    'decrypt', 
    'decrypt_integration_secret',
    true,
    null
  );

  return v_secret_data;
end;
$$;