-- ============================================
-- FASE A.1: Tabela ml_sync_status
-- Controla última sincronização de cada seller
-- ZERO IMPACTO: tabela nova, não afeta sistema atual
-- ============================================

CREATE TABLE IF NOT EXISTS public.ml_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  integration_account_id UUID NOT NULL,
  
  -- Controle de sincronização
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'pending', -- 'success', 'error', 'pending'
  last_sync_error TEXT,
  
  -- Métricas da última sync
  orders_fetched INT DEFAULT 0,
  orders_cached INT DEFAULT 0,
  sync_duration_ms INT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: 1 registro por conta
  UNIQUE(organization_id, integration_account_id)
);

-- Índices otimizados
CREATE INDEX IF NOT EXISTS idx_ml_sync_status_org_account 
ON public.ml_sync_status(organization_id, integration_account_id);

CREATE INDEX IF NOT EXISTS idx_ml_sync_status_last_sync 
ON public.ml_sync_status(last_sync_at);

-- Enable RLS
ALTER TABLE public.ml_sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read sync status from their organization"
ON public.ml_sync_status
FOR SELECT
USING (organization_id = get_current_org_id());

CREATE POLICY "System can insert sync status"
ON public.ml_sync_status
FOR INSERT
WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "System can update sync status"
ON public.ml_sync_status
FOR UPDATE
USING (organization_id = get_current_org_id());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ml_sync_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ml_sync_status_updated_at
BEFORE UPDATE ON public.ml_sync_status
FOR EACH ROW
EXECUTE FUNCTION update_ml_sync_status_updated_at();

-- Comentários
COMMENT ON TABLE public.ml_sync_status IS 'Controla status e histórico de sincronizações automáticas de pedidos ML por conta';
COMMENT ON COLUMN public.ml_sync_status.last_sync_at IS 'Data/hora da última sincronização bem-sucedida (usado para sync incremental)';
COMMENT ON COLUMN public.ml_sync_status.last_sync_status IS 'Status da última sync: success, error, pending';
COMMENT ON COLUMN public.ml_sync_status.orders_fetched IS 'Quantos pedidos foram buscados da ML API na última sync';
COMMENT ON COLUMN public.ml_sync_status.orders_cached IS 'Quantos pedidos foram salvos no cache na última sync';