-- 🔐 Sistema Completo de Autenticação Empresarial
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
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo, 6=sábado
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
  blocked_reason TEXT, -- fora_horario, muitas_tentativas, etc
  attempt_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_id TEXT
);

-- 4. TABELA DE BACKUP AUTOMÁTICO
CREATE TABLE IF NOT EXISTS public.system_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  backup_type TEXT NOT NULL, -- full, incremental, critical_data
  file_path TEXT NOT NULL,
  file_size BIGINT,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
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
  request_type TEXT NOT NULL, -- access, correction, deletion, portability, opt_out
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, rejected
  requested_by_email TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  response_data JSONB,
  notes TEXT
);

-- 6. MELHORAR TABELA DE AUDIT_LOGS (já existe, vamos adicionar campos)
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS module TEXT,
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info', -- debug, info, warning, error, critical
ADD COLUMN IF NOT EXISTS source_function TEXT,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- 7. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_access_schedule_org_user ON public.access_schedule(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_access_schedule_org_role ON public.access_schedule(organization_id, role_id);
CREATE INDEX IF NOT EXISTS idx_access_schedule_day ON public.access_schedule(day_of_week);

CREATE INDEX IF NOT EXISTS idx_access_attempts_user_id ON public.access_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_access_attempts_ip ON public.access_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_access_attempts_time ON public.access_attempts(attempt_time);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON public.audit_logs(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);

-- 8. RLS POLICIES
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

-- Policies para password_reset_tokens (apenas service role)
CREATE POLICY "password_reset_tokens_service_only" ON public.password_reset_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Policies para access_schedule
CREATE POLICY "access_schedule_admin_manage" ON public.access_schedule
  FOR ALL USING (organization_id = get_current_org_id() AND has_permission('system:manage_access'));

CREATE POLICY "access_schedule_users_read_own" ON public.access_schedule
  FOR SELECT USING (user_id = auth.uid() OR 
    (role_id IN (SELECT role_id FROM user_role_assignments WHERE user_id = auth.uid())));

-- Policies para access_attempts (apenas admins)
CREATE POLICY "access_attempts_admin_only" ON public.access_attempts
  FOR ALL USING (has_permission('system:audit'));

-- Policies para system_backups (apenas admins)
CREATE POLICY "system_backups_admin_only" ON public.system_backups
  FOR ALL USING (organization_id = get_current_org_id() AND has_permission('system:backup'));

-- Policies para data_subject_requests
CREATE POLICY "data_subject_requests_admin_manage" ON public.data_subject_requests
  FOR ALL USING (organization_id = get_current_org_id() AND has_permission('system:lgpd'));

CREATE POLICY "data_subject_requests_user_own" ON public.data_subject_requests
  FOR SELECT USING (user_id = auth.uid());

-- 9. FUNÇÕES DE SEGURANÇA

-- Função para validar horário de acesso
CREATE OR REPLACE FUNCTION public.check_access_schedule(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_day INTEGER;
  current_time TIME;
  current_tz TEXT;
  has_schedule BOOLEAN := FALSE;
  is_allowed BOOLEAN := FALSE;
BEGIN
  -- Verificar se há alguma configuração de horário
  SELECT EXISTS(
    SELECT 1 FROM public.access_schedule 
    WHERE (user_id = _user_id OR role_id IN (
      SELECT role_id FROM user_role_assignments WHERE user_id = _user_id
    )) AND is_active = TRUE
  ) INTO has_schedule;
  
  -- Se não há configuração, permite acesso
  IF NOT has_schedule THEN
    RETURN TRUE;
  END IF;
  
  -- Obter dia da semana e horário atual (0=domingo)
  current_day := EXTRACT(DOW FROM NOW() AT TIME ZONE 'America/Sao_Paulo');
  current_time := (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIME;
  
  -- Verificar se está dentro de algum horário permitido
  SELECT EXISTS(
    SELECT 1 FROM public.access_schedule 
    WHERE (user_id = _user_id OR role_id IN (
      SELECT role_id FROM user_role_assignments WHERE user_id = _user_id
    ))
    AND is_active = TRUE
    AND day_of_week = current_day
    AND start_time <= current_time
    AND end_time >= current_time
  ) INTO is_allowed;
  
  RETURN is_allowed;
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

-- Função para logs de auditoria avançados
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
    duration_ms,
    session_id
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
    p_duration_ms,
    current_setting('app.session_id', true)
  );
END;
$$;

-- Função para LGPD - Solicitar dados do usuário
CREATE OR REPLACE FUNCTION public.request_user_data(_email TEXT, _request_type TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id UUID;
  _user_id UUID;
  _request_id UUID;
BEGIN
  _org_id := get_current_org_id();
  
  -- Buscar usuário
  SELECT id INTO _user_id FROM auth.users WHERE email = _email;
  
  -- Criar solicitação
  INSERT INTO public.data_subject_requests (
    organization_id, user_id, request_type, requested_by_email
  ) VALUES (
    _org_id, _user_id, _request_type, _email
  ) RETURNING id INTO _request_id;
  
  -- Log da solicitação
  PERFORM log_audit_enhanced(
    'data_request',
    'lgpd',
    _request_id::TEXT,
    NULL,
    json_build_object('type', _request_type, 'email', _email)::JSONB,
    'compliance',
    'info'
  );
  
  RETURN json_build_object('success', true, 'request_id', _request_id);
END;
$$;

-- 10. TRIGGERS PARA AUDITORIA AUTOMÁTICA

-- Trigger para logar tentativas de acesso
CREATE OR REPLACE FUNCTION public.log_access_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Este trigger seria chamado por um sistema de autenticação
  -- Por enquanto, apenas um placeholder
  RETURN NEW;
END;
$$;

-- 11. FUNÇÃO DE LIMPEZA AUTOMÁTICA
CREATE OR REPLACE FUNCTION public.cleanup_security_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpar tokens de reset expirados
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < NOW() - INTERVAL '24 hours';
  
  -- Limpar tentativas de acesso antigas (manter 90 dias)
  DELETE FROM public.access_attempts 
  WHERE attempt_time < NOW() - INTERVAL '90 days';
  
  -- Limpar backups expirados
  DELETE FROM public.system_backups 
  WHERE retention_until < NOW();
  
  -- Limpar logs de auditoria antigos (manter 2 anos)
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Log da limpeza
  PERFORM log_audit_enhanced(
    'cleanup',
    'system',
    NULL,
    NULL,
    json_build_object('cleaned_at', NOW())::JSONB,
    'maintenance',
    'info'
  );
END;
$$;