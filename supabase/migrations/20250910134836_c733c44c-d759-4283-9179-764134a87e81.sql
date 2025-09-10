-- Habilitar pg_cron e pg_net se ainda não estiverem habilitados
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar refresh automático dos tokens ML a cada 2 horas
-- (6h de validade - refresh a cada 2h = margem segura)
SELECT cron.schedule(
  'ml-token-refresh-every-2h',
  '0 */2 * * *', -- A cada 2 horas no minuto 0
  $$
  SELECT
    net.http_post(
        url:='https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/ml-token-refresh-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"}'::jsonb,
        body:='{"scheduled": true, "trigger_time": "' || now()::text || '"}'::jsonb
    ) as request_id;
  $$
);