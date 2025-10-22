-- =====================================================
-- CRON JOB PARA PROCESSAR FILA DE CLAIMS
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar cron job para processar fila a cada minuto
SELECT cron.schedule(
  'process-claims-queue-job',
  '* * * * *', -- Executar a cada minuto
  $$
  SELECT
    net.http_post(
      url:='https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/process-claims-queue',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Função para verificar status da fila
CREATE OR REPLACE FUNCTION get_queue_status()
RETURNS TABLE(
  total_pending bigint,
  total_processing bigint,
  total_completed bigint,
  total_failed bigint,
  oldest_pending timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as total_pending,
    COUNT(*) FILTER (WHERE status = 'processing') as total_processing,
    COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
    COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
    MIN(criado_em) FILTER (WHERE status = 'pending') as oldest_pending
  FROM fila_processamento_claims;
$$;