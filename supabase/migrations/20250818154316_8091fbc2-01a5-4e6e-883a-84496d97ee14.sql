-- 1) historico_vendas: substituir bloqueio total por política de SELECT estrita por organização + permissão
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'historico_vendas' 
      AND policyname = 'historico_vendas_complete_block'
  ) THEN
    EXECUTE 'DROP POLICY "historico_vendas_complete_block" ON public.historico_vendas';
  END IF;
END $$;

-- Ativar RLS (por segurança)
ALTER TABLE public.historico_vendas ENABLE ROW LEVEL SECURITY;

-- Permitir apenas SELECT para membros da organização com permissão adequada
CREATE POLICY "hv_select_org_perms" ON public.historico_vendas
FOR SELECT USING (
  public.has_permission('vendas:read')
  AND EXISTS (
    SELECT 1 FROM public.integration_accounts ia
    WHERE ia.id = historico_vendas.integration_account_id
      AND ia.organization_id = public.get_current_org_id()
  )
);

-- 2) Fortalecer auditoria de segredos: atualizar métricas de acesso
CREATE OR REPLACE FUNCTION public.get_integration_secret_secure(
  account_id uuid,
  provider_name text,
  requesting_function text DEFAULT 'unknown'
)
RETURNS TABLE(
  access_token text,
  refresh_token text,
  client_id text,
  client_secret text,
  expires_at timestamp with time zone,
  payload jsonb
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  secret_data jsonb;
  encryption_key text;
BEGIN
  -- Get encryption key from vault or environment
  SELECT value INTO encryption_key FROM vault.secrets WHERE name = 'APP_ENCRYPTION_KEY' LIMIT 1;
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;

  -- Decrypt and parse secret data
  SELECT extensions.pgp_sym_decrypt(s.secret_enc, encryption_key)::jsonb INTO secret_data
  FROM public.integration_secrets s
  WHERE s.integration_account_id = account_id 
    AND s.provider = provider_name;

  IF NOT FOUND THEN
    RETURN; -- no rows
  END IF;

  -- Fire-and-forget audit log
  BEGIN
    INSERT INTO public.integration_secrets_audit (
      account_id, action, provider, requesting_function, user_id, created_at
    ) VALUES (
      account_id, 'access', provider_name, requesting_function, auth.uid(), now()
    );
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Update access metrics (last_accessed_at, access_count)
  BEGIN
    UPDATE public.integration_secrets
    SET last_accessed_at = now(), access_count = COALESCE(access_count,0) + 1
    WHERE integration_account_id = account_id AND provider = provider_name;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Return the decrypted secret data
  RETURN QUERY SELECT 
    secret_data->>'access_token',
    secret_data->>'refresh_token',
    secret_data->>'client_id',
    secret_data->>'client_secret',
    CASE 
      WHEN secret_data->>'expires_at' IS NOT NULL THEN (secret_data->>'expires_at')::timestamptz
      ELSE NULL
    END,
    secret_data->'payload';
END;
$function$;