-- P2: Habilitar RLS em tabelas sem RLS e corrigir warnings de segurança

-- 1. Identificar e corrigir tabelas sem RLS
DO $$
DECLARE
    r RECORD;
    table_count INTEGER := 0;
BEGIN
    -- Habilitar RLS em tabelas públicas que não têm
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE c.relrowsecurity = true
            AND t.schemaname = 'public'
        )
        AND tablename NOT LIKE '%backup%'
    LOOP
        -- Verificar se é tabela de dados ou apenas de configuração
        IF r.tablename IN ('integration_secrets_backup') THEN
            CONTINUE; -- Pular tabelas de backup
        END IF;
        
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
        
        -- Criar política restritiva padrão se não existir nenhuma política
        BEGIN
            EXECUTE format('CREATE POLICY "default_deny_all" ON public.%I FOR ALL USING (false)', r.tablename);
        EXCEPTION WHEN duplicate_object THEN
            -- Política já existe, tudo bem
            NULL;
        END;
        
        table_count := table_count + 1;
        RAISE NOTICE 'RLS habilitado para tabela: %', r.tablename;
    END LOOP;
    
    RAISE NOTICE 'Total de tabelas com RLS habilitado: %', table_count;
END $$;

-- 2. Corrigir search_path nas funções críticas (adicionar SET search_path)
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

-- 3. Corrigir função update_integration_secrets_updated_at
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