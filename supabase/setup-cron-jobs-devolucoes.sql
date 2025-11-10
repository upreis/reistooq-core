-- ============================================
-- 🔄 CRON JOBS - FASE 6: AUTOMAÇÃO DE DEVOLUÇÕES
-- ============================================
-- Este arquivo configura jobs automáticos para:
-- 1. Sincronização de devoluções (a cada 1 hora)
-- 2. Enriquecimento de devoluções (a cada 6 horas)
--
-- ⚠️ IMPORTANTE: Execute este SQL manualmente no Supabase SQL Editor
-- NÃO use o migration tool pois contém dados específicos do projeto
-- ============================================

-- 🔍 Verificar se extensions estão habilitadas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE EXCEPTION 'Extension pg_cron não está habilitada. Habilite nas configurações do Supabase.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE EXCEPTION 'Extension pg_net não está habilitada. Habilite nas configurações do Supabase.';
  END IF;
  
  RAISE NOTICE '✅ Extensions pg_cron e pg_net estão habilitadas';
END $$;

-- ============================================
-- 1️⃣ CRON JOB: Sincronização de Devoluções
-- ============================================
-- Frequência: A cada 1 hora (no minuto 0)
-- Função: sync-devolucoes
-- Descrição: Busca novas devoluções do Mercado Livre e salva no banco local
-- ============================================

SELECT cron.schedule(
  'sync-devolucoes-hourly',  -- Nome do job
  '0 * * * *',                -- A cada hora, no minuto 0 (ex: 10:00, 11:00, 12:00)
  $$
  SELECT
    net.http_post(
      url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/sync-devolucoes',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5NzM1MywiZXhwIjoyMDY5NDczMzUzfQ.2zMgRGY8_Zd1VN2LAjDZaP3-I-8BNJzCKLAeG7LnzR0'
      ),
      body := jsonb_build_object(
        'integration_account_id', '4d22ffe5-0b02-4cd2-ab42-b3f168307425',
        'batch_size', 100,
        'trigger', 'cron'
      )
    ) as request_id;
  $$
);

-- ============================================
-- 2️⃣ CRON JOB: Enriquecimento de Devoluções
-- ============================================
-- Frequência: A cada 6 horas (00:00, 06:00, 12:00, 18:00)
-- Função: enrich-devolucoes
-- Descrição: Enriquece devoluções com dados de compradores e produtos
-- ============================================

SELECT cron.schedule(
  'enrich-devolucoes-6hours',  -- Nome do job
  '0 */6 * * *',               -- A cada 6 horas, no minuto 0
  $$
  SELECT
    net.http_post(
      url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/enrich-devolucoes',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5NzM1MywiZXhwIjoyMDY5NDczMzUzfQ.2zMgRGY8_Zd1VN2LAjDZaP3-I-8BNJzCKLAeG7LnzR0'
      ),
      body := jsonb_build_object(
        'integration_account_id', '4d22ffe5-0b02-4cd2-ab42-b3f168307425',
        'limit', 50,
        'trigger', 'cron'
      )
    ) as request_id;
  $$
);

-- ============================================
-- 📊 VERIFICAR JOBS CRIADOS
-- ============================================
-- Execute esta query para verificar se os jobs foram criados corretamente

SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname IN ('sync-devolucoes-hourly', 'enrich-devolucoes-6hours')
ORDER BY jobid;

-- ============================================
-- 🗑️ REMOVER JOBS (SE NECESSÁRIO)
-- ============================================
-- Descomente e execute se precisar remover os jobs

-- SELECT cron.unschedule('sync-devolucoes-hourly');
-- SELECT cron.unscedule('enrich-devolucoes-6hours');

-- ============================================
-- 📈 MONITORAR EXECUÇÕES DOS JOBS
-- ============================================
-- Esta query mostra as últimas execuções dos jobs de devoluções

SELECT 
  j.jobname,
  jd.start_time,
  jd.end_time,
  jd.status,
  EXTRACT(EPOCH FROM (jd.end_time - jd.start_time)) as duration_seconds,
  jd.return_message
FROM cron.job j
LEFT JOIN cron.job_run_details jd ON j.jobid = jd.jobid
WHERE j.jobname IN ('sync-devolucoes-hourly', 'enrich-devolucoes-6hours')
ORDER BY jd.start_time DESC
LIMIT 20;

-- ============================================
-- 🔧 CONFIGURAÇÕES ADICIONAIS
-- ============================================

-- Para TESTAR o job manualmente (sem esperar o cron):
-- Execute diretamente a Edge Function via Supabase Dashboard ou usando:
/*
SELECT net.http_post(
  url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/sync-devolucoes',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  ),
  body := jsonb_build_object(
    'integration_account_id', '4d22ffe5-0b02-4cd2-ab42-b3f168307425',
    'batch_size', 100
  )
);
*/

-- ============================================
-- ✅ CHECKLIST DE IMPLEMENTAÇÃO
-- ============================================
-- [ ] 1. Verificar que pg_cron e pg_net estão habilitadas
-- [ ] 2. Executar este SQL no Supabase SQL Editor
-- [ ] 3. Verificar jobs criados usando query de verificação
-- [ ] 4. Aguardar primeira execução automática
-- [ ] 5. Monitorar logs usando query de monitoramento
-- [ ] 6. Verificar devolucoes_sync_status para sucesso
-- ============================================
