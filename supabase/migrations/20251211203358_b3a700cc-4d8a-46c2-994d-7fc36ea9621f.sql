-- Criar CRON job para backfill de shipping_state
SELECT cron.schedule(
  'backfill-shipping-states-auto',
  '*/2 * * * *',  -- A cada 2 minutos
  $$
  SELECT net.http_post(
    url := (SELECT current_setting('app.settings.supabase_url') || '/functions/v1/backfill-shipping-states'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT current_setting('app.settings.service_role_key'))
    ),
    body := jsonb_build_object(
      'organization_id', '9d52ba63-0de8-4d77-8b57-ed14d3189768',
      'limit', 200
    )
  );
  $$
);