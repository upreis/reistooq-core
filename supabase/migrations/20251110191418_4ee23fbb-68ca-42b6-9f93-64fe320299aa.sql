-- ✅ CORREÇÃO 1: Ajustar funções SQL helper para assinaturas compatíveis

-- Recriar start_devolucoes_sync com assinatura correta
CREATE OR REPLACE FUNCTION public.start_devolucoes_sync(
  p_integration_account_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sync_id uuid;
BEGIN
  INSERT INTO public.devolucoes_sync_status (
    integration_account_id,
    status,
    started_at
  ) VALUES (
    p_integration_account_id,
    'running',
    now()
  )
  RETURNING id INTO v_sync_id;
  
  RETURN v_sync_id;
END;
$$;

-- Recriar complete_devolucoes_sync com assinatura correta
CREATE OR REPLACE FUNCTION public.complete_devolucoes_sync(
  p_sync_id uuid,
  p_total_processed integer,
  p_total_created integer,
  p_total_updated integer,
  p_duration_ms integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.devolucoes_sync_status
  SET 
    status = 'completed',
    completed_at = now(),
    total_processed = p_total_processed,
    total_created = p_total_created,
    total_updated = p_total_updated,
    duration_ms = p_duration_ms
  WHERE id = p_sync_id;
END;
$$;

-- Recriar fail_devolucoes_sync com assinatura correta
CREATE OR REPLACE FUNCTION public.fail_devolucoes_sync(
  p_sync_id uuid,
  p_error_message text,
  p_duration_ms integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.devolucoes_sync_status
  SET 
    status = 'failed',
    completed_at = now(),
    error_message = p_error_message,
    duration_ms = p_duration_ms
  WHERE id = p_sync_id;
END;
$$;

-- ✅ CORREÇÃO 2: Verificar e adicionar colunas JSONB se não existirem
DO $$
BEGIN
  -- Adicionar dados_buyer_info se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'devolucoes_avancadas' 
    AND column_name = 'dados_buyer_info'
  ) THEN
    ALTER TABLE public.devolucoes_avancadas 
    ADD COLUMN dados_buyer_info jsonb;
  END IF;
  
  -- Adicionar dados_product_info se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'devolucoes_avancadas' 
    AND column_name = 'dados_product_info'
  ) THEN
    ALTER TABLE public.devolucoes_avancadas 
    ADD COLUMN dados_product_info jsonb;
  END IF;
END $$;

-- ✅ CORREÇÃO 3: Adicionar índices para as novas colunas JSONB
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_buyer_info 
ON public.devolucoes_avancadas USING gin(dados_buyer_info);

CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_product_info 
ON public.devolucoes_avancadas USING gin(dados_product_info);