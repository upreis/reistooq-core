-- P0: Corrigir função decrypt_integration_secret para retornar formato correto
-- Compatível com a estrutura esperada pelas edge functions

DROP FUNCTION IF EXISTS public.decrypt_integration_secret(uuid, text, text);

CREATE OR REPLACE FUNCTION public.decrypt_integration_secret(
  p_account_id uuid,
  p_provider text,
  p_encryption_key text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_secret_data jsonb;
  v_raw_data text;
begin
  -- Validate inputs
  if p_account_id is null then
    raise exception 'account_id cannot be null';
  end if;
  
  if coalesce(p_provider, '') = '' then
    raise exception 'provider cannot be empty';
  end if;
  
  if coalesce(p_encryption_key, '') = '' then
    raise exception 'APP_ENCRYPTION_KEY missing or empty';
  end if;

  -- Log access attempt for audit
  perform public.log_secret_access(
    p_account_id, 
    p_provider, 
    'decrypt_attempt', 
    'decrypt_integration_secret',
    false,  -- will update to true if successful
    null
  );

  -- Decrypt secret data from new table structure
  select pgp_sym_decrypt(s.secret_enc, p_encryption_key)
    into v_raw_data
  from public.integration_secrets s
  where s.integration_account_id = p_account_id 
    and s.provider = p_provider;

  if v_raw_data is null then
    -- Log failed access
    perform public.log_secret_access(
      p_account_id, 
      p_provider, 
      'decrypt_failed', 
      'decrypt_integration_secret',
      false,
      'No secrets found for account'
    );
    raise exception 'No secrets found for account % provider %', p_account_id, p_provider;
  end if;

  -- Parse JSON
  begin
    v_secret_data := v_raw_data::jsonb;
  exception when others then
    perform public.log_secret_access(
      p_account_id, 
      p_provider, 
      'decrypt_failed', 
      'decrypt_integration_secret',
      false,
      'Failed to parse decrypted JSON'
    );
    raise exception 'Failed to parse decrypted secret data for account %', p_account_id;
  end;

  -- Update access metrics
  update public.integration_secrets
  set access_count = coalesce(access_count, 0) + 1,
      last_accessed_at = now()
  where integration_account_id = p_account_id and provider = p_provider;

  -- Log successful access
  perform public.log_secret_access(
    p_account_id, 
    p_provider, 
    'decrypt_success', 
    'decrypt_integration_secret',
    true,
    null
  );

  return v_secret_data;
exception when others then
  -- Log any unexpected errors
  perform public.log_secret_access(
    p_account_id, 
    p_provider, 
    'decrypt_error', 
    'decrypt_integration_secret',
    false,
    SQLERRM
  );
  raise;
end;
$$;