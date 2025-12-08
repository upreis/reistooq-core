-- ============================================
-- CRON JOB: Sincronização Vendas Com Envio
-- ============================================
-- Executa a cada 30 minutos para sincronizar
-- pedidos com status ready_to_ship, pending, handling
-- ============================================

-- 1. Verificar se extensions estão habilitadas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE EXCEPTION 'Extension pg_cron não está habilitada. Habilite em Database > Extensions';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE EXCEPTION 'Extension pg_net não está habilitada. Habilite em Database > Extensions';
  END IF;
END $$;

-- 2. Remover job existente se houver (para evitar duplicação)
SELECT cron.unschedule('sync-vendas-comenvio-30min')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-vendas-comenvio-30min'
);

-- 3. Criar CRON job - executa a cada 30 minutos
SELECT cron.schedule(
  'sync-vendas-comenvio-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/ml-vendas-comenvio-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 4. Verificar job criado
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database,
  username
FROM cron.job 
WHERE jobname = 'sync-vendas-comenvio-30min';

-- ============================================
-- COMANDOS ÚTEIS
-- ============================================

-- Verificar últimas execuções:
/*
SELECT 
  j.jobname,
  jd.start_time,
  jd.end_time,
  jd.status,
  EXTRACT(EPOCH FROM (jd.end_time - jd.start_time)) as duration_seconds,
  jd.return_message
FROM cron.job j
LEFT JOIN cron.job_run_details jd ON j.jobid = jd.jobid
WHERE j.jobname = 'sync-vendas-comenvio-30min'
ORDER BY jd.start_time DESC
LIMIT 10;
*/

-- Desabilitar temporariamente:
/*
UPDATE cron.job 
SET active = false 
WHERE jobname = 'sync-vendas-comenvio-30min';
*/

-- Remover permanentemente:
/*
SELECT cron.unschedule('sync-vendas-comenvio-30min');
*/

-- Testar manualmente (sem esperar CRON):
/*
SELECT net.http_post(
  url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/ml-vendas-comenvio-sync',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk'
  ),
  body := '{}'::jsonb
);
*/
