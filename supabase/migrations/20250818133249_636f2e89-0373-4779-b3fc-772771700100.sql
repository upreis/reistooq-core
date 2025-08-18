-- AUDITORIA COMPLETA DE SEGURANÇA DE DADOS - SISTEMA REISTOQ
-- Aplicando correções CRÍTICAS de segurança

-- ===== PARTE A: CORREÇÃO DE POLÍTICAS RLS CRÍTICAS =====

-- A1. Corrigir políticas RLS da tabela profiles
-- Problema: User Profile Data Could Be Stolen by Hackers
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_create_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;

-- Criar políticas mais restritivas e seguras
CREATE POLICY "profiles_select_org_secure" ON public.profiles 
FOR SELECT USING (
  id = auth.uid() OR 
  (organizacao_id = get_current_org_id() AND has_permission('users:read'))
);

CREATE POLICY "profiles_update_self_only" ON public.profiles 
FOR UPDATE USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_self_only" ON public.profiles 
FOR INSERT WITH CHECK (id = auth.uid());

-- A2. Reforçar segurança da tabela organizacoes
-- Problema: Organization Data Could Be Accessed by Wrong Users
DROP POLICY IF EXISTS "orgs_select_own" ON public.organizacoes;
DROP POLICY IF EXISTS "orgs_admin_same_org" ON public.organizacoes;

CREATE POLICY "org_select_current_only" ON public.organizacoes 
FOR SELECT USING (id = get_current_org_id());

-- A3. Bloquear completamente acesso direto a integration_secrets
-- Problema: API Keys and Credentials Could Be Stolen
DROP POLICY IF EXISTS "integration_secrets: service role functions only" ON public.integration_secrets;
DROP POLICY IF EXISTS "intsec_block_clients" ON public.integration_secrets;
DROP POLICY IF EXISTS "is_deny_all" ON public.integration_secrets;

-- Política de negação total para clientes
CREATE POLICY "integration_secrets_deny_all_client_access" ON public.integration_secrets
FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- A4. Reforçar bloqueio do historico_vendas
-- Problema: Business Financial Data Could Be Accessed by Competitors
DROP POLICY IF EXISTS "hv_block_iud" ON public.historico_vendas;
DROP POLICY IF EXISTS "hv_deny_all_auth" ON public.historico_vendas;

CREATE POLICY "historico_vendas_complete_block" ON public.historico_vendas
FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- ===== PARTE B: FUNCTIONS DE MASCARAMENTO SEGURAS =====

-- B1. Function para mascarar e-mails
CREATE OR REPLACE FUNCTION public.mask_email(email_input text)
RETURNS text AS $$
DECLARE
  parts text[];
  username text;
  domain text;
BEGIN
  IF email_input IS NULL OR email_input = '' THEN
    RETURN NULL;
  END IF;
  
  parts := string_to_array(email_input, '@');
  IF array_length(parts, 1) <> 2 THEN
    RETURN '***@***.com';
  END IF;
  
  username := parts[1];
  domain := parts[2];
  
  -- Mascarar username: primeira letra + *** + @domain
  RETURN left(username, 1) || '***@' || domain;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- B2. Melhorar function de mascaramento de telefone existente
CREATE OR REPLACE FUNCTION public.mask_phone_secure(phone_input text)
RETURNS text AS $$
BEGIN
  IF phone_input IS NULL OR length(btrim(phone_input)) < 4 THEN
    RETURN '****';
  END IF;
  
  -- Remover caracteres não numéricos
  phone_input := regexp_replace(phone_input, '[^0-9]', '', 'g');
  
  -- Retornar **** + últimos 4 dígitos
  RETURN '****' || right(phone_input, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- ===== PARTE C: VIEW SEGURA PARA PROFILES =====

-- C1. Criar view segura para profiles com mascaramento automático
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
  p.id,
  p.nome_completo,
  p.nome_exibicao,
  CASE 
    WHEN p.id = auth.uid() THEN p.telefone
    ELSE public.mask_phone_secure(p.telefone)
  END AS telefone,
  p.cargo,
  p.departamento,
  p.organizacao_id,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  p.onboarding_banner_dismissed,
  p.configuracoes_notificacao
FROM public.profiles p
WHERE p.organizacao_id = get_current_org_id();

-- C2. Dar permissões adequadas para a view
GRANT SELECT ON public.profiles_safe TO authenticated;

-- ===== PARTE D: AUDITORIA E MONITORAMENTO =====

-- D1. Melhorar tabela de auditoria de integration_secrets
CREATE TABLE IF NOT EXISTS public.integration_secrets_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_account_id uuid NOT NULL,
  provider text NOT NULL,
  action text NOT NULL CHECK (action IN ('decrypt', 'encrypt', 'access_attempt', 'unauthorized_access')),
  requesting_function text,
  user_id uuid,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- RLS para logs de auditoria (apenas admins)
ALTER TABLE public.integration_secrets_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_only" ON public.integration_secrets_access_log
FOR ALL USING (has_permission('system:audit'));

-- D2. Function para registrar tentativas de acesso
CREATE OR REPLACE FUNCTION public.log_secret_access(
  p_account_id uuid,
  p_provider text,
  p_action text,
  p_function text DEFAULT NULL,
  p_success boolean DEFAULT false,
  p_error text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.integration_secrets_access_log (
    integration_account_id,
    provider,
    action,
    requesting_function,
    user_id,
    success,
    error_message
  ) VALUES (
    p_account_id,
    p_provider,
    p_action,
    p_function,
    auth.uid(),
    p_success,
    p_error
  );
EXCEPTION WHEN OTHERS THEN
  -- Não falhar se log não conseguir ser inserido
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===== PARTE E: HARDENING DE FUNCTIONS EXISTENTES =====

-- E1. Corrigir search_path em functions (correção do linter)
CREATE OR REPLACE FUNCTION public.mask_document(doc text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  digits text;
  len int;
BEGIN
  IF doc IS NULL OR btrim(doc) = '' THEN
    RETURN NULL;
  END IF;
  digits := regexp_replace(doc, '\\D', '', 'g');
  len := length(digits);
  IF len <= 4 THEN
    RETURN repeat('*', GREATEST(len - 1, 0)) || right(digits, LEAST(len, 1));
  ELSIF len <= 11 THEN -- CPF
    RETURN repeat('*', len - 2) || right(digits, 2);
  ELSE -- CNPJ ou outros maiores
    RETURN repeat('*', len - 4) || right(digits, 4);
  END IF;
END;
$$;

-- E2. Corrigir search_path em mask_name
CREATE OR REPLACE FUNCTION public.mask_name(full_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n text;
  parts text[];
BEGIN
  IF full_name IS NULL OR btrim(full_name) = '' THEN
    RETURN NULL;
  END IF;
  n := btrim(full_name);
  parts := regexp_split_to_array(n, '\\s+');
  IF array_length(parts, 1) = 1 THEN
    RETURN left(parts[1], 1) || '***';
  ELSE
    RETURN parts[1] || ' ' || left(parts[array_length(parts,1)], 1) || '.';
  END IF;
END;
$$;

-- ===== PARTE F: LIMPEZA E POLÍTICA DE RETENÇÃO =====

-- F1. Function para limpeza automática de dados sensíveis
CREATE OR REPLACE FUNCTION public.cleanup_expired_sensitive_data()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpar estados OAuth expirados
  DELETE FROM public.oauth_states 
  WHERE expires_at < now() - interval '1 hour';
  
  -- Limpar logs de auditoria antigos (manter apenas 2 anos)
  DELETE FROM public.integration_secrets_access_log 
  WHERE created_at < now() - interval '2 years';
  
  -- Limpar audit_logs antigos (manter apenas 1 ano)
  DELETE FROM public.audit_logs 
  WHERE created_at < now() - interval '1 year';
  
  -- Log da operação de limpeza
  INSERT INTO public.audit_logs (
    organization_id, user_id, action, resource_type, resource_id
  ) VALUES (
    NULL, NULL, 'cleanup', 'system', 'automated_cleanup'
  );
END;
$$ LANGUAGE plpgsql;

-- ===== PARTE G: CONFIGURAÇÕES FINAIS DE SEGURANÇA =====

-- G1. Garantir que todas as tabelas críticas têm RLS habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_secrets_access_log ENABLE ROW LEVEL SECURITY;

-- G2. Revogar permissões desnecessárias
REVOKE ALL ON public.integration_secrets FROM authenticated, anon;
REVOKE ALL ON public.historico_vendas FROM authenticated, anon;

-- G3. Conceder apenas permissões necessárias para functions seguras
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_masked TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_phone_secure TO authenticated;

-- Comentários finais de segurança
COMMENT ON TABLE public.integration_secrets IS 'CRÍTICO: Tabela contém secrets criptografados. Acesso apenas via Edge Functions.';
COMMENT ON TABLE public.historico_vendas IS 'CRÍTICO: Dados de vendas sensíveis. Acesso apenas via get_historico_vendas_masked().';
COMMENT ON VIEW public.profiles_safe IS 'VIEW SEGURA: Acesso a profiles com mascaramento automático de dados sensíveis.';