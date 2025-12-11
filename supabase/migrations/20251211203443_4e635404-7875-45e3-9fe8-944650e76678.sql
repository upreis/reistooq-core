-- Remover CRON job anterior e criar novo com chave correta
SELECT cron.unschedule('backfill-shipping-states-auto');

SELECT cron.schedule(
  'backfill-shipping-states-auto',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/backfill-shipping-states',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"}'::jsonb,
    body := '{"organization_id": "9d52ba63-0de8-4d77-8b57-ed14d3189768", "limit": 200}'::jsonb
  );
  $$
);