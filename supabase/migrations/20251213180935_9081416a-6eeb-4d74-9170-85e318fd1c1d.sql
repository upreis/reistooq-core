-- Criar CRON job para agregar vendas diariamente à 1h da manhã (após meia-noite SP)
SELECT cron.schedule(
  'agregar-vendas-diarias-midnight',
  '0 4 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/agregar-vendas-diarias',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMDYxNTIsImV4cCI6MjA1OTg4MjE1Mn0.kI-cI17V3b3IrLMVuzM_zE_B10FbB1SXkJPDZoKvT08"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);