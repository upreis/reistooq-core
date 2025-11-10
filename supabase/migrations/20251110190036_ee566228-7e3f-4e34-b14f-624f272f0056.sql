-- ============================================
-- FASE 1: PREPARAÇÃO DO BANCO - DEVOLUÇÕES ML
-- ============================================

-- 1. CRIAR TABELA devolucoes_sync_status
-- ============================================
CREATE TABLE IF NOT EXISTS public.devolucoes_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_account_id UUID NOT NULL REFERENCES integration_accounts(id) ON DELETE CASCADE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'in_progress', 'pending')),
  sync_type TEXT CHECK (sync_type IN ('full', 'incremental', 'enrichment')),
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  items_total INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB DEFAULT '{}'::jsonb,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para evitar duplicatas
  UNIQUE(integration_account_id, sync_type)
);

-- Índices para devolucoes_sync_status
CREATE INDEX IF NOT EXISTS idx_devolucoes_sync_status_account 
  ON public.devolucoes_sync_status(integration_account_id);

CREATE INDEX IF NOT EXISTS idx_devolucoes_sync_status_last_sync 
  ON public.devolucoes_sync_status(last_sync_at DESC);

CREATE INDEX IF NOT EXISTS idx_devolucoes_sync_status_status 
  ON public.devolucoes_sync_status(last_sync_status);

-- RLS Policies para devolucoes_sync_status
ALTER TABLE public.devolucoes_sync_status ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver status de sincronização das suas contas
CREATE POLICY "Users can view sync status from their org"
  ON public.devolucoes_sync_status
  FOR SELECT
  USING (
    integration_account_id IN (
      SELECT id FROM integration_accounts 
      WHERE organization_id = get_current_org_id()
    )
  );

-- Policy: Sistema pode inserir/atualizar status de sincronização
CREATE POLICY "System can manage sync status"
  ON public.devolucoes_sync_status
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.devolucoes_sync_status IS 'Controla o status de sincronização de devoluções para cada conta de integração';
COMMENT ON COLUMN public.devolucoes_sync_status.sync_type IS 'Tipo de sincronização: full (completa), incremental (últimos N dias), enrichment (enriquecimento)';
COMMENT ON COLUMN public.devolucoes_sync_status.last_sync_status IS 'Status da última sincronização: success, error, in_progress, pending';

-- 2. ADICIONAR ÍNDICES OTIMIZADOS em devolucoes_avancadas
-- ============================================

-- Índices para filtros comuns
CREATE INDEX IF NOT EXISTS idx_devolucoes_integration_account 
  ON public.devolucoes_avancadas(integration_account_id);

CREATE INDEX IF NOT EXISTS idx_devolucoes_status 
  ON public.devolucoes_avancadas(status_devolucao);

CREATE INDEX IF NOT EXISTS idx_devolucoes_data_criacao 
  ON public.devolucoes_avancadas(data_criacao DESC);

CREATE INDEX IF NOT EXISTS idx_devolucoes_updated_at 
  ON public.devolucoes_avancadas(updated_at DESC);

-- Índice composto para query principal (account + data)
CREATE INDEX IF NOT EXISTS idx_devolucoes_account_data 
  ON public.devolucoes_avancadas(integration_account_id, data_criacao DESC);

-- Índice composto para filtros por status
CREATE INDEX IF NOT EXISTS idx_devolucoes_account_status 
  ON public.devolucoes_avancadas(integration_account_id, status_devolucao);

-- Índices para IDs externos (busca por claim_id, order_id, return_id)
CREATE INDEX IF NOT EXISTS idx_devolucoes_claim_id 
  ON public.devolucoes_avancadas(claim_id);

CREATE INDEX IF NOT EXISTS idx_devolucoes_order_id 
  ON public.devolucoes_avancadas(order_id);

CREATE INDEX IF NOT EXISTS idx_devolucoes_return_id 
  ON public.devolucoes_avancadas(return_id);

-- Índices GIN para campos JSONB (buscas em JSON)
CREATE INDEX IF NOT EXISTS idx_devolucoes_buyer_info_gin 
  ON public.devolucoes_avancadas USING GIN (dados_buyer_info);

CREATE INDEX IF NOT EXISTS idx_devolucoes_product_info_gin 
  ON public.devolucoes_avancadas USING GIN (dados_product_info);

CREATE INDEX IF NOT EXISTS idx_devolucoes_financial_info_gin 
  ON public.devolucoes_avancadas USING GIN (dados_financial_info);

CREATE INDEX IF NOT EXISTS idx_devolucoes_tracking_info_gin 
  ON public.devolucoes_avancadas USING GIN (dados_tracking_info);

CREATE INDEX IF NOT EXISTS idx_devolucoes_review_gin 
  ON public.devolucoes_avancadas USING GIN (dados_review);

-- Índice para busca por SKU
CREATE INDEX IF NOT EXISTS idx_devolucoes_sku 
  ON public.devolucoes_avancadas(sku);

-- Índice para busca por marketplace
CREATE INDEX IF NOT EXISTS idx_devolucoes_marketplace 
  ON public.devolucoes_avancadas(marketplace_origem);

-- 3. FUNÇÃO DE ATUALIZAÇÃO DE updated_at
-- ============================================

-- Trigger para atualizar updated_at automaticamente em devolucoes_sync_status
CREATE OR REPLACE FUNCTION update_devolucoes_sync_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_devolucoes_sync_status_updated_at
  BEFORE UPDATE ON public.devolucoes_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION update_devolucoes_sync_status_updated_at();

-- 4. FUNÇÕES AUXILIARES PARA SYNC STATUS
-- ============================================

-- Função para iniciar sincronização
CREATE OR REPLACE FUNCTION start_devolucoes_sync(
  p_account_id UUID,
  p_sync_type TEXT DEFAULT 'incremental'
)
RETURNS UUID AS $$
DECLARE
  v_sync_id UUID;
BEGIN
  INSERT INTO public.devolucoes_sync_status (
    integration_account_id,
    sync_type,
    last_sync_status,
    last_sync_at
  )
  VALUES (
    p_account_id,
    p_sync_type,
    'in_progress',
    NOW()
  )
  ON CONFLICT (integration_account_id, sync_type) 
  DO UPDATE SET
    last_sync_status = 'in_progress',
    last_sync_at = NOW(),
    error_message = NULL,
    error_details = '{}'::jsonb
  RETURNING id INTO v_sync_id;
  
  RETURN v_sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para finalizar sincronização com sucesso
CREATE OR REPLACE FUNCTION complete_devolucoes_sync(
  p_account_id UUID,
  p_sync_type TEXT,
  p_items_synced INTEGER,
  p_items_failed INTEGER,
  p_items_total INTEGER,
  p_duration_ms INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.devolucoes_sync_status
  SET
    last_sync_status = CASE 
      WHEN p_items_failed = 0 THEN 'success'
      WHEN p_items_synced > 0 THEN 'success' -- Sucesso parcial
      ELSE 'error'
    END,
    items_synced = p_items_synced,
    items_failed = p_items_failed,
    items_total = p_items_total,
    duration_ms = p_duration_ms,
    updated_at = NOW()
  WHERE integration_account_id = p_account_id
    AND sync_type = p_sync_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar sincronização com erro
CREATE OR REPLACE FUNCTION fail_devolucoes_sync(
  p_account_id UUID,
  p_sync_type TEXT,
  p_error_message TEXT,
  p_error_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.devolucoes_sync_status
  SET
    last_sync_status = 'error',
    error_message = p_error_message,
    error_details = p_error_details,
    updated_at = NOW()
  WHERE integration_account_id = p_account_id
    AND sync_type = p_sync_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter última sincronização por conta
CREATE OR REPLACE FUNCTION get_last_sync_time(
  p_account_id UUID,
  p_sync_type TEXT DEFAULT 'incremental'
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_last_sync TIMESTAMPTZ;
BEGIN
  SELECT last_sync_at INTO v_last_sync
  FROM public.devolucoes_sync_status
  WHERE integration_account_id = p_account_id
    AND sync_type = p_sync_type
    AND last_sync_status = 'success';
  
  RETURN COALESCE(v_last_sync, NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. VIEW PARA ESTATÍSTICAS DE SINCRONIZAÇÃO
-- ============================================

CREATE OR REPLACE VIEW public.devolucoes_sync_stats AS
SELECT 
  dss.integration_account_id,
  ia.name as account_name,
  ia.organization_id,
  dss.sync_type,
  dss.last_sync_at,
  dss.last_sync_status,
  dss.items_synced,
  dss.items_failed,
  dss.items_total,
  dss.duration_ms,
  dss.error_message,
  CASE 
    WHEN dss.last_sync_at IS NULL THEN 'Nunca sincronizado'
    WHEN dss.last_sync_status = 'in_progress' THEN 'Sincronizando...'
    WHEN dss.last_sync_at < NOW() - INTERVAL '1 hour' THEN 'Desatualizado'
    ELSE 'Atualizado'
  END as sync_health,
  EXTRACT(EPOCH FROM (NOW() - dss.last_sync_at)) / 60 as minutes_since_sync
FROM public.devolucoes_sync_status dss
JOIN integration_accounts ia ON ia.id = dss.integration_account_id
ORDER BY dss.last_sync_at DESC NULLS LAST;

-- Grant para authenticated users
GRANT SELECT ON public.devolucoes_sync_stats TO authenticated;

-- ============================================
-- VALIDAÇÃO DE COLUNAS JSONB
-- ============================================

-- Verificar se todas as colunas JSONB necessárias existem
DO $$ 
DECLARE
  v_columns TEXT[] := ARRAY[
    'dados_buyer_info',
    'dados_product_info', 
    'dados_financial_info',
    'dados_tracking_info',
    'dados_review',
    'dados_comunicacao',
    'dados_deadlines',
    'dados_acoes_disponiveis',
    'dados_custos_logistica',
    'dados_fulfillment',
    'dados_available_actions',
    'dados_shipping_costs',
    'dados_refund_info'
  ];
  v_col TEXT;
  v_exists BOOLEAN;
BEGIN
  FOREACH v_col IN ARRAY v_columns
  LOOP
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'devolucoes_avancadas' 
        AND column_name = v_col
    ) INTO v_exists;
    
    IF NOT v_exists THEN
      RAISE NOTICE 'Coluna JSONB faltando: %', v_col;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Validação de colunas JSONB concluída';
END $$;