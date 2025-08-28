-- Verificar se system_alerts já existe antes de criar
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('info', 'warning', 'error', 'success')),
  priority INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  href TEXT,
  link_label TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Verificar se user_dismissed_notifications já existe antes de criar
CREATE TABLE IF NOT EXISTS public.user_dismissed_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('system_alert', 'announcement')),
  notification_id TEXT NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_type, notification_id)
);

-- Verificar se system_backups já existe antes de criar
CREATE TABLE IF NOT EXISTS public.system_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'critical_data')),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retention_until TIMESTAMP WITH TIME ZONE,
  checksum TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dismissed_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- RLS Policies para system_alerts
CREATE POLICY "system_alerts_admin_manage" ON public.system_alerts
FOR ALL USING (
  organization_id = public.get_current_org_id() AND 
  public.has_permission('system:announce')
);

CREATE POLICY "system_alerts_users_read" ON public.system_alerts
FOR SELECT USING (
  organization_id = public.get_current_org_id() AND 
  active = true AND
  (expires_at IS NULL OR expires_at > now())
);

-- RLS Policies para user_dismissed_notifications
CREATE POLICY "user_dismissed_notifications_own" ON public.user_dismissed_notifications
FOR ALL USING (user_id = auth.uid());

-- RLS Policies para system_backups
CREATE POLICY "system_backups_admin_manage" ON public.system_backups
FOR ALL USING (
  organization_id = public.get_current_org_id() AND 
  public.has_permission('system:backup')
);

-- Adicionar trigger de updated_at para system_alerts
CREATE OR REPLACE TRIGGER update_system_alerts_updated_at
BEFORE UPDATE ON public.system_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar trigger de updated_at para system_backups
CREATE OR REPLACE TRIGGER update_system_backups_updated_at
BEFORE UPDATE ON public.system_backups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Verificar se há convites órfãos e adicionar foreign key constraint para invitations
DO $$
BEGIN
  -- Primeiro verificar se há registros órfãos
  IF NOT EXISTS (
    SELECT 1 FROM public.invitations i
    LEFT JOIN public.roles r ON r.id = i.role_id
    WHERE r.id IS NULL
  ) THEN
    -- Se não há órfãos, adicionar a constraint
    ALTER TABLE public.invitations 
    ADD CONSTRAINT fk_invitations_role_id 
    FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint já existe, ignora
    NULL;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_system_alerts_org_active ON public.system_alerts(organization_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_system_alerts_expires ON public.system_alerts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_dismissed_notifications_user ON public.user_dismissed_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_system_backups_org_status ON public.system_backups(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_system_backups_retention ON public.system_backups(retention_until) WHERE retention_until IS NOT NULL;