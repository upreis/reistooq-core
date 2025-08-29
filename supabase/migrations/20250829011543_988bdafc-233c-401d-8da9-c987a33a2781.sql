-- Adicionar colunas de segmentação para system_alerts
ALTER TABLE public.system_alerts 
ADD COLUMN IF NOT EXISTS target_users uuid[], 
ADD COLUMN IF NOT EXISTS target_roles uuid[],
ADD COLUMN IF NOT EXISTS target_routes text[];

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.system_alerts.target_users IS 'Array de IDs de usuários específicos que devem ver o alerta';
COMMENT ON COLUMN public.system_alerts.target_roles IS 'Array de IDs de roles que devem ver o alerta';
COMMENT ON COLUMN public.system_alerts.target_routes IS 'Array de rotas/páginas onde o alerta deve aparecer';