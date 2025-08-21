-- Habilitar RLS na tabela integration_secrets_backup
ALTER TABLE public.integration_secrets_backup ENABLE ROW LEVEL SECURITY;

-- Criar política restritiva para esta tabela de backup (somente service role)
CREATE POLICY "integration_secrets_backup: service role only" 
ON public.integration_secrets_backup 
FOR ALL USING (auth.role() = 'service_role');