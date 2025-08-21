-- P0: Normalizar integration_secrets sem downtime (corrigido)
-- Migrar schema de integration_secrets para formato final e garantir compatibilidade

-- 1. Verificar estrutura atual e criar backup
CREATE TABLE IF NOT EXISTS integration_secrets_backup AS 
SELECT * FROM public.integration_secrets;

-- 2. Verificar colunas existentes na tabela backup
DO $$
DECLARE
    col_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'integration_secrets_backup' 
        AND column_name = 'secret_enc'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        RAISE NOTICE 'Column secret_enc does not exist, using enc_data';
    END IF;
END $$;

-- 3. Criar nova estrutura da tabela integration_secrets
DROP TABLE IF EXISTS public.integration_secrets CASCADE;

CREATE TABLE public.integration_secrets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_account_id uuid NOT NULL,
  provider text NOT NULL,
  organization_id uuid NOT NULL,
  secret_enc bytea NOT NULL,
  expires_at timestamp with time zone,
  payload jsonb DEFAULT '{}'::jsonb,
  access_count integer DEFAULT 0,
  last_accessed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT integration_secrets_unique UNIQUE (integration_account_id, provider),
  CONSTRAINT fk_integration_account FOREIGN KEY (integration_account_id) 
    REFERENCES public.integration_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) 
    REFERENCES public.organizacoes(id) ON DELETE CASCADE
);

-- 4. Migrar dados da tabela backup (usando enc_data que existe)
INSERT INTO public.integration_secrets (
  integration_account_id,
  provider,
  organization_id,
  secret_enc,
  expires_at,
  payload,
  created_at,
  updated_at
)
SELECT 
  CASE 
    WHEN backup.account_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN backup.account_id::uuid
    ELSE gen_random_uuid() -- Fallback se não for UUID válido
  END as integration_account_id,
  backup.provider,
  COALESCE(ia.organization_id, (SELECT id FROM public.organizacoes LIMIT 1)) as organization_id,
  backup.enc_data as secret_enc, -- Usar enc_data (que existe)
  backup.expires_at,
  COALESCE(backup.payload, '{}'::jsonb) as payload,
  COALESCE(backup.created_at, now()) as created_at,
  COALESCE(backup.updated_at, now()) as updated_at
FROM integration_secrets_backup backup
LEFT JOIN public.integration_accounts ia ON (
  backup.account_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
  AND ia.id = backup.account_id::uuid
)
WHERE backup.enc_data IS NOT NULL; -- Só migrar se tiver dados criptografados

-- 5. Habilitar RLS e criar políticas restritivas
ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;

-- Política: Apenas service role pode acessar (para edge functions)
CREATE POLICY "integration_secrets_service_role_only" ON public.integration_secrets
  FOR ALL USING (auth.role() = 'service_role');

-- 6. Atualizar função decrypt_integration_secret para novo schema
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
begin
  -- Validate encryption key
  if coalesce(p_encryption_key, '') = '' then
    raise exception 'APP_ENCRYPTION_KEY missing';
  end if;

  -- Decrypt secret data from new table structure
  select pgp_sym_decrypt(s.secret_enc, p_encryption_key)::jsonb 
    into v_secret_data
  from public.integration_secrets s
  where s.integration_account_id = p_account_id 
    and s.provider = p_provider;

  if v_secret_data is null then
    raise exception 'No secrets found for account % provider %', p_account_id, p_provider;
  end if;

  -- Update access metrics
  update public.integration_secrets
  set access_count = coalesce(access_count, 0) + 1,
      last_accessed_at = now()
  where integration_account_id = p_account_id and provider = p_provider;

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

-- 7. Atualizar função encrypt_integration_secret para novo schema
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
SET search_path TO 'public'
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

  -- Insert or update encrypted secret in new structure
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

-- 8. Adicionar trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_integration_secrets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_integration_secrets_updated_at
  BEFORE UPDATE ON public.integration_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integration_secrets_updated_at();

-- 9. Adicionar índices para performance
CREATE INDEX idx_integration_secrets_account_provider 
  ON public.integration_secrets(integration_account_id, provider);
CREATE INDEX idx_integration_secrets_organization 
  ON public.integration_secrets(organization_id);
CREATE INDEX idx_integration_secrets_expires_at 
  ON public.integration_secrets(expires_at) WHERE expires_at IS NOT NULL;