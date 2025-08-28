-- Primeiro, vamos verificar se system_alerts existe e criar campos necessários
DO $$
BEGIN
  -- Adicionar organization_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.system_alerts 
    ADD COLUMN organization_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE;
  END IF;
  
  -- Garantir que a tabela system_alerts tenha todas as colunas necessárias
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.system_alerts 
    ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Criar user_dismissed_notifications se não existir
CREATE TABLE IF NOT EXISTS public.user_dismissed_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('system_alert', 'announcement')),
  notification_id TEXT NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_type, notification_id)
);

-- Criar system_backups se não existir
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

-- Limpar políticas existentes para system_alerts e recriar
DROP POLICY IF EXISTS "system_alerts_admin_manage" ON public.system_alerts;
DROP POLICY IF EXISTS "system_alerts_users_read" ON public.system_alerts;

-- RLS Policies para system_alerts (ajustadas)
CREATE POLICY "system_alerts_admin_manage" ON public.system_alerts
FOR ALL USING (
  (organization_id IS NULL OR organization_id = public.get_current_org_id()) AND 
  public.has_permission('system:announce')
);

CREATE POLICY "system_alerts_users_read" ON public.system_alerts
FOR SELECT USING (
  (organization_id IS NULL OR organization_id = public.get_current_org_id()) AND 
  active = true AND
  (expires_at IS NULL OR expires_at > now())
);

-- RLS Policies para user_dismissed_notifications
DROP POLICY IF EXISTS "user_dismissed_notifications_own" ON public.user_dismissed_notifications;
CREATE POLICY "user_dismissed_notifications_own" ON public.user_dismissed_notifications
FOR ALL USING (user_id = auth.uid());

-- RLS Policies para system_backups
DROP POLICY IF EXISTS "system_backups_admin_manage" ON public.system_backups;
CREATE POLICY "system_backups_admin_manage" ON public.system_backups
FOR ALL USING (
  organization_id = public.get_current_org_id() AND 
  public.has_permission('system:backup')
);

-- Adicionar trigger de updated_at para system_backups se não existir
DROP TRIGGER IF EXISTS update_system_backups_updated_at ON public.system_backups;
CREATE TRIGGER update_system_backups_updated_at
BEFORE UPDATE ON public.system_backups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_system_alerts_org_active ON public.system_alerts(organization_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_system_alerts_expires ON public.system_alerts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_dismissed_notifications_user ON public.user_dismissed_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_system_backups_org_status ON public.system_backups(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_system_backups_retention ON public.system_backups(retention_until) WHERE retention_until IS NOT NULL;