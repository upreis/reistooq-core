-- Adicionar colunas necessárias para controle de sincronização de devoluções
ALTER TABLE public.sync_control
ADD COLUMN IF NOT EXISTS integration_account_id UUID REFERENCES public.integration_accounts(id),
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_claims INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS progress_current INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para busca rápida por integration_account_id e provider
CREATE INDEX IF NOT EXISTS idx_sync_control_account_provider 
ON public.sync_control(integration_account_id, provider);

-- Atualizar a função RPC get_sync_control_status
DROP FUNCTION IF EXISTS public.get_sync_control_status(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_sync_control_status(
  p_integration_account_id UUID,
  p_provider TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT to_jsonb(sc.*) INTO v_result
  FROM public.sync_control sc
  WHERE sc.integration_account_id = p_integration_account_id
    AND sc.provider = p_provider
  LIMIT 1;

  RETURN v_result;
END;
$$;