-- ===============================================
-- FASE 6: OTIMIZAÇÕES - BACKGROUND JOBS E CACHE
-- ===============================================

-- 1️⃣ TABELA DE CONTROLE DE BACKGROUND JOBS
CREATE TABLE IF NOT EXISTS public.background_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  resource_type text NOT NULL, -- devolucao, order, claim
  resource_id text NOT NULL,
  priority int DEFAULT 5, -- 1=highest, 10=lowest
  retry_count int DEFAULT 0,
  max_retries int DEFAULT 3,
  scheduled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para background jobs
CREATE INDEX IF NOT EXISTS idx_bg_jobs_status_priority 
  ON public.background_jobs (status, priority, scheduled_at)
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_bg_jobs_type_status 
  ON public.background_jobs (job_type, status);

CREATE INDEX IF NOT EXISTS idx_bg_jobs_resource 
  ON public.background_jobs (resource_type, resource_id);

-- 2️⃣ FUNÇÃO PARA ENFILEIRAR BACKGROUND JOB
CREATE OR REPLACE FUNCTION public.enqueue_background_job(
  p_job_type text,
  p_resource_type text,
  p_resource_id text,
  p_priority int DEFAULT 5,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  INSERT INTO public.background_jobs (
    job_type,
    resource_type,
    resource_id,
    priority,
    metadata
  ) VALUES (
    p_job_type,
    p_resource_type,
    p_resource_id,
    p_priority,
    p_metadata
  )
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$;

-- 3️⃣ FUNÇÃO PARA PROCESSAR PRÓXIMO JOB
CREATE OR REPLACE FUNCTION public.get_next_background_job()
RETURNS TABLE (
  id uuid,
  job_type text,
  resource_type text,
  resource_id text,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  -- Buscar próximo job pendente (lock para evitar concorrência)
  SELECT bj.id INTO v_job_id
  FROM public.background_jobs bj
  WHERE bj.status = 'pending'
    AND bj.scheduled_at <= now()
    AND bj.retry_count < bj.max_retries
  ORDER BY bj.priority ASC, bj.scheduled_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF v_job_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Marcar como processing
  UPDATE public.background_jobs
  SET 
    status = 'processing',
    started_at = now(),
    updated_at = now()
  WHERE background_jobs.id = v_job_id;
  
  -- Retornar dados do job
  RETURN QUERY
  SELECT 
    bj.id,
    bj.job_type,
    bj.resource_type,
    bj.resource_id,
    bj.metadata
  FROM public.background_jobs bj
  WHERE bj.id = v_job_id;
END;
$$;

-- 4️⃣ FUNÇÃO PARA COMPLETAR JOB
CREATE OR REPLACE FUNCTION public.complete_background_job(
  p_job_id uuid,
  p_success boolean,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_success THEN
    UPDATE public.background_jobs
    SET 
      status = 'completed',
      completed_at = now(),
      updated_at = now()
    WHERE id = p_job_id;
  ELSE
    UPDATE public.background_jobs
    SET 
      status = CASE 
        WHEN retry_count + 1 >= max_retries THEN 'failed'
        ELSE 'pending'
      END,
      retry_count = retry_count + 1,
      error_message = p_error_message,
      scheduled_at = now() + (interval '5 minutes' * (retry_count + 1)), -- Exponential backoff
      updated_at = now()
    WHERE id = p_job_id;
  END IF;
END;
$$;

-- 5️⃣ VIEW MATERIALIZADA PARA CACHE DE MÉTRICAS  
CREATE MATERIALIZED VIEW IF NOT EXISTS public.devolucoes_metrics_cache AS
SELECT 
  integration_account_id,
  DATE(data_criacao_devolucao) as date,
  COUNT(*) as total_devolucoes,
  COUNT(*) FILTER (WHERE status_devolucao = 'opened') as abertas,
  COUNT(*) FILTER (WHERE status_devolucao = 'closed') as fechadas,
  COUNT(*) FILTER (WHERE em_mediacao = true) as em_mediacao,
  SUM(COALESCE(valor_retido, 0)) as valor_total,
  AVG(COALESCE(valor_retido, 0)) as valor_medio,
  COUNT(*) FILTER (WHERE dados_order IS NOT NULL) as com_dados_order,
  COUNT(*) FILTER (WHERE dados_claim IS NOT NULL) as com_dados_claim,
  COUNT(*) FILTER (WHERE dados_return IS NOT NULL) as com_dados_return,
  now() as updated_at
FROM public.devolucoes_avancadas
WHERE data_criacao_devolucao IS NOT NULL
GROUP BY integration_account_id, DATE(data_criacao_devolucao);

-- Índice na view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_cache_unique 
  ON public.devolucoes_metrics_cache (integration_account_id, date);

CREATE INDEX IF NOT EXISTS idx_metrics_cache_date 
  ON public.devolucoes_metrics_cache (date DESC);

-- 6️⃣ FUNÇÃO PARA REFRESH DA VIEW MATERIALIZADA
CREATE OR REPLACE FUNCTION public.refresh_devolucoes_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.devolucoes_metrics_cache;
END;
$$;

-- 7️⃣ ÍNDICES JSONB ADICIONAIS PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_dev_order_id 
  ON public.devolucoes_avancadas ((dados_order->>'id'))
  WHERE dados_order IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dev_claim_id 
  ON public.devolucoes_avancadas ((dados_claim->>'id'))
  WHERE dados_claim IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dev_return_id 
  ON public.devolucoes_avancadas ((dados_return->>'id'))
  WHERE dados_return IS NOT NULL;

-- 8️⃣ ÍNDICE COMPOSTO PARA QUERIES COMUNS
CREATE INDEX IF NOT EXISTS idx_dev_account_status_date 
  ON public.devolucoes_avancadas (integration_account_id, status_devolucao, data_criacao_devolucao DESC)
  WHERE data_criacao_devolucao IS NOT NULL;

-- Comentários
COMMENT ON TABLE public.background_jobs IS 'Fila de jobs assíncronos para processamento em background com retry automático e exponential backoff';
COMMENT ON MATERIALIZED VIEW public.devolucoes_metrics_cache IS 'Cache de métricas agregadas para dashboard (refresh manual via cron job ou sob demanda)';
COMMENT ON FUNCTION public.enqueue_background_job IS 'Adiciona um novo job na fila de processamento assíncrono';
COMMENT ON FUNCTION public.get_next_background_job IS 'Retorna e marca como processing o próximo job pendente (com lock para evitar concorrência)';
COMMENT ON FUNCTION public.complete_background_job IS 'Marca job como completo ou falho com retry automático e exponential backoff';
COMMENT ON FUNCTION public.refresh_devolucoes_metrics IS 'Atualiza a view materializada de métricas de devoluções (execute via cron job)';
