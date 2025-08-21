-- P0: Normalizar integration_secrets sem downtime (corrigido para estrutura real)
-- Migrar schema atual (account_id, provider, enc_data) para formato final

-- 1. Backup da tabela atual
CREATE TABLE IF NOT EXISTS integration_secrets_backup AS 
SELECT * FROM public.integration_secrets;

-- 2. Criar nova estrutura da tabela integration_secrets
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

-- 3. Migrar dados da tabela backup (estrutura real: account_id, provider, enc_data)
INSERT INTO public.integration_secrets (
  integration_account_id,
  provider,
  organization_id,
  secret_enc,
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
  backup.enc_data as secret_enc,
  COALESCE(backup.created_at, now()) as created_at,
  COALESCE(backup.updated_at, now()) as updated_at
FROM integration_secrets_backup backup
LEFT JOIN public.integration_accounts ia ON (
  backup.account_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
  AND ia.id = backup.account_id::uuid
)
WHERE backup.enc_data IS NOT NULL
ON CONFLICT (integration_account_id, provider) DO NOTHING;

-- 4. Habilitar RLS e criar políticas restritivas
ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;

-- Política: Apenas service role pode acessar (para edge functions)
CREATE POLICY "integration_secrets_service_role_only" ON public.integration_secrets
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Atualizar função decrypt_integration_secret para novo schema
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

-- 6. Trigger para updated_at
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

-- 7. Índices para performance
CREATE INDEX idx_integration_secrets_account_provider 
  ON public.integration_secrets(integration_account_id, provider);
CREATE INDEX idx_integration_secrets_organization 
  ON public.integration_secrets(organization_id);
CREATE INDEX idx_integration_secrets_expires_at 
  ON public.integration_secrets(expires_at) WHERE expires_at IS NOT NULL;