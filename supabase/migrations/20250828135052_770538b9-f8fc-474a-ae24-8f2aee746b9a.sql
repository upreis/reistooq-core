-- 🔐 Sistema Completo de Autenticação Empresarial - CORREÇÃO
-- Recursos: Reset de senha, controle de horário, auditoria completa, backup

-- 1. TABELA DE TOKENS DE RESET DE SENHA
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT
);

-- 2. TABELA DE CONTROLE DE HORÁRIO DE ACESSO
CREATE TABLE IF NOT EXISTS public.access_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  role_id UUID,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT check_user_or_role CHECK (user_id IS NOT NULL OR role_id IS NOT NULL),
  CONSTRAINT check_time_range CHECK (start_time < end_time)
);

-- 3. TABELA DE LOG DE TENTATIVAS DE ACESSO
CREATE TABLE IF NOT EXISTS public.access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  blocked_reason TEXT,
  attempt_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_id TEXT
);

-- 4. TABELA DE BACKUP AUTOMÁTICO
CREATE TABLE IF NOT EXISTS public.system_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  backup_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retention_until TIMESTAMP WITH TIME ZONE,
  checksum TEXT
);

-- 5. TABELA DE COMPLIANCE LGPD
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  request_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  requested_by_email TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  response_data JSONB,
  notes TEXT
);

-- 6. MELHORAR TABELA DE AUDIT_LOGS
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS module TEXT,
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS source_function TEXT,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- 7. RLS POLICIES
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "password_reset_tokens_service_only" ON public.password_reset_tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "access_schedule_admin_manage" ON public.access_schedule
  FOR ALL USING (organization_id = get_current_org_id() AND has_permission('system:manage_access'));

CREATE POLICY "access_schedule_users_read_own" ON public.access_schedule
  FOR SELECT USING (user_id = auth.uid() OR 
    (role_id IN (SELECT role_id FROM user_role_assignments WHERE user_id = auth.uid())));

CREATE POLICY "access_attempts_admin_only" ON public.access_attempts
  FOR ALL USING (has_permission('system:audit'));

CREATE POLICY "system_backups_admin_only" ON public.system_backups
  FOR ALL USING (organization_id = get_current_org_id() AND has_permission('system:backup'));

CREATE POLICY "data_subject_requests_admin_manage" ON public.data_subject_requests
  FOR ALL USING (organization_id = get_current_org_id() AND has_permission('system:lgpd'));

CREATE POLICY "data_subject_requests_user_own" ON public.data_subject_requests
  FOR SELECT USING (user_id = auth.uid());

-- 8. FUNÇÕES CORRIGIDAS

-- Função para validar horário de acesso (corrigida)
CREATE OR REPLACE FUNCTION public.check_access_schedule(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_day INTEGER;
  v_current_time TIME;
  v_has_schedule BOOLEAN := FALSE;
  v_is_allowed BOOLEAN := FALSE;
BEGIN
  -- Verificar se há configuração de horário
  SELECT EXISTS(
    SELECT 1 FROM public.access_schedule 
    WHERE (user_id = _user_id OR role_id IN (
      SELECT role_id FROM user_role_assignments WHERE user_id = _user_id
    )) AND is_active = TRUE
  ) INTO v_has_schedule;
  
  -- Se não há configuração, permite acesso
  IF NOT v_has_schedule THEN
    RETURN TRUE;
  END IF;
  
  -- Obter dia da semana e horário atual
  v_current_day := EXTRACT(DOW FROM NOW() AT TIME ZONE 'America/Sao_Paulo');
  v_current_time := (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIME;
  
  -- Verificar se está dentro de algum horário permitido
  SELECT EXISTS(
    SELECT 1 FROM public.access_schedule 
    WHERE (user_id = _user_id OR role_id IN (
      SELECT role_id FROM user_role_assignments WHERE user_id = _user_id
    ))
    AND is_active = TRUE
    AND day_of_week = v_current_day
    AND start_time <= v_current_time
    AND end_time >= v_current_time
  ) INTO v_is_allowed;
  
  RETURN v_is_allowed;
END;
$$;

-- Função para gerar token de reset
CREATE OR REPLACE FUNCTION public.generate_password_reset_token(_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _token TEXT;
  _expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar usuário pelo email
  SELECT id INTO _user_id FROM auth.users WHERE email = _email;
  
  IF _user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Email não encontrado');
  END IF;
  
  -- Invalidar tokens anteriores
  UPDATE public.password_reset_tokens 
  SET used = TRUE 
  WHERE user_id = _user_id AND used = FALSE;
  
  -- Gerar novo token
  _token := encode(gen_random_bytes(32), 'hex');
  _expires_at := NOW() + INTERVAL '1 hour';
  
  -- Inserir token
  INSERT INTO public.password_reset_tokens (user_id, token, expires_at)
  VALUES (_user_id, _token, _expires_at);
  
  RETURN json_build_object(
    'success', true,
    'token', _token,
    'expires_at', _expires_at
  );
END;
$$;

-- Função de auditoria avançada
CREATE OR REPLACE FUNCTION public.log_audit_enhanced(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_module TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info',
  p_source_function TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    module,
    severity,
    source_function,
    duration_ms
  ) VALUES (
    get_current_org_id(),
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_module,
    p_severity,
    p_source_function,
    p_duration_ms
  );
END;
$$;