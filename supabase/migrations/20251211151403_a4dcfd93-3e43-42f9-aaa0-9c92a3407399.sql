-- Índice para melhorar performance da limpeza diária
CREATE INDEX IF NOT EXISTS idx_vendas_hoje_realtime_date_created 
ON vendas_hoje_realtime(date_created);

-- CRON job para limpeza diária às 03:00 UTC (00:00 em Brasília)
SELECT cron.schedule(
  'cleanup-vendas-antigas-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/cleanup-vendas-antigas',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);