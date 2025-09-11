-- Configurar cron job para refresh automático de tokens ML a cada 2 horas
-- Primeiro, habilitar as extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar o cron job que executa a cada 2 horas (a partir das 00:00)
SELECT cron.schedule(
  'ml-token-refresh-every-2h',
  '0 */2 * * *', -- A cada 2 horas (00:00, 02:00, 04:00, etc.)
  $$
  SELECT
    net.http_post(
        url:='https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/ml-token-refresh-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5NzM1MywiZXhwIjoyMDY5NDczMzUzfQ.2zMgRGY8_Zd1VN2LAjDZaP3-I-8BNJzCKLAeG7LnzR0"}'::jsonb,
        body:='{"automated": true, "interval": "2h"}'::jsonb
    ) as request_id;
  $$
);