-- Configurar CRON job para sincronização de orders a cada 1 hora
-- Remove job antigo se existir
DO $$
BEGIN
  PERFORM cron.unschedule('ml-orders-auto-sync-hourly');
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignora se não existir
END $$;

-- Criar novo job com frequência de 1 hora
SELECT cron.schedule(
  'ml-orders-auto-sync-hourly',
  '0 * * * *', -- A cada hora, no minuto 0
  $$
  SELECT net.http_post(
    url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/ml-orders-auto-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);