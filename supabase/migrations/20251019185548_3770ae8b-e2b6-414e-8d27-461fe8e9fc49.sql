-- ========================================
-- ETAPA 3: Configurar pg_cron para sincronização automática (CORRIGIDO)
-- ========================================
-- Descrição: Configura job automático para sincronizar devoluções ML a cada 2 horas
-- Segurança: ✅ Apenas cria job CRON, não modifica dados existentes

-- Verificar se pg_cron está disponível
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover job anterior se existir (para reconfiguração limpa)
SELECT cron.unschedule('sync-ml-devolucoes-auto') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-ml-devolucoes-auto'
);

-- Criar job para executar a cada 2 horas
SELECT cron.schedule(
  'sync-ml-devolucoes-auto',
  '0 */2 * * *', -- A cada 2 horas (00:00, 02:00, 04:00, etc.)
  $$
  SELECT
    net.http_post(
      url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/sync-devolucoes-ml',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk'
      ),
      body := jsonb_build_object('auto_sync', true)
    ) as request_id;
  $$
);

-- ✅ Verificação: Job criado com sucesso
DO $$
DECLARE
  job_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count 
  FROM cron.job 
  WHERE jobname = 'sync-ml-devolucoes-auto';
  
  IF job_count > 0 THEN
    RAISE NOTICE '✅ CRON Job "sync-ml-devolucoes-auto" configurado com sucesso';
    RAISE NOTICE '⏰ Agenda: A cada 2 horas (0 */2 * * *)';
    RAISE NOTICE '🎯 Função: sync-devolucoes-ml';
  ELSE
    RAISE WARNING '⚠️ Falha ao criar CRON Job';
  END IF;
END $$;