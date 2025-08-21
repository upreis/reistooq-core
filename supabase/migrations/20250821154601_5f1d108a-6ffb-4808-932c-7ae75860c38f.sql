-- 1. Remover função incompatível atual
DROP FUNCTION IF EXISTS public.encrypt_integration_secret(text, text, text, text, text, text, timestamp with time zone, jsonb, text);

-- 2. Criar nova função encrypt_integration_secret compatível com estrutura atual
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
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_plain jsonb;
  v_org_id uuid;
begin
  -- Validar se encryption key foi fornecida
  if coalesce(p_encryption_key,'') = '' then
    raise exception 'APP_ENCRYPTION_KEY is required';
  end if;

  -- Buscar organization_id do integration_account
  SELECT organization_id INTO v_org_id 
  FROM public.integration_accounts 
  WHERE id = p_account_id;
  
  IF v_org_id IS NULL THEN
    raise exception 'Integration account not found: %', p_account_id;
  END IF;

  -- Construir objeto JSON com os dados sensíveis
  v_plain := jsonb_build_object(
    'client_id', p_client_id,
    'client_secret', p_client_secret,
    'access_token', p_access_token,
    'refresh_token', p_refresh_token,
    'expires_at', p_expires_at,
    'payload', coalesce(p_payload, '{}'::jsonb)
  );

  -- Inserir ou atualizar na tabela integration_secrets
  INSERT INTO public.integration_secrets (
    integration_account_id,
    provider,
    organization_id,
    secret_enc,
    expires_at,
    payload,
    created_at,
    updated_at
  ) VALUES (
    p_account_id,
    p_provider,
    v_org_id,
    pgp_sym_encrypt(v_plain::text, p_encryption_key),
    p_expires_at,
    coalesce(p_payload, '{}'::jsonb),
    now(),
    now()
  )
  ON CONFLICT (integration_account_id, provider) 
  DO UPDATE SET
    secret_enc = pgp_sym_encrypt(v_plain::text, p_encryption_key),
    expires_at = EXCLUDED.expires_at,
    payload = EXCLUDED.payload,
    updated_at = now();
    
end;
$function$;