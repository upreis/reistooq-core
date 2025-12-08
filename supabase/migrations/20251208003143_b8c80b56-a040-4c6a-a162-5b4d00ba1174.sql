-- ============================================
-- 🚀 TABELA: ml_vendas_comenvio
-- Tabela própria para página /vendas-canceladas-comenvio
-- Isolada de ml_orders_cache
-- ============================================

CREATE TABLE IF NOT EXISTS public.ml_vendas_comenvio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores
  order_id TEXT NOT NULL,
  integration_account_id UUID NOT NULL REFERENCES public.integration_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  
  -- Dados completos do pedido (JSONB)
  order_data JSONB,
  
  -- Campos principais extraídos para queries e filtros
  status TEXT,
  date_created TIMESTAMPTZ,
  date_closed TIMESTAMPTZ,
  
  -- Comprador
  buyer_id TEXT,
  buyer_nickname TEXT,
  buyer_first_name TEXT,
  buyer_last_name TEXT,
  
  -- Valores
  total_amount NUMERIC(12,2),
  paid_amount NUMERIC(12,2),
  currency_id TEXT DEFAULT 'BRL',
  
  -- Envio
  shipping_id TEXT,
  shipping_status TEXT,
  logistic_type TEXT,
  
  -- Produto principal (primeiro item)
  item_id TEXT,
  item_title TEXT,
  item_sku TEXT,
  item_quantity INTEGER,
  
  -- Controle de sincronização
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint única
  UNIQUE(order_id, integration_account_id)
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ml_vendas_comenvio_org 
  ON public.ml_vendas_comenvio(organization_id);

CREATE INDEX IF NOT EXISTS idx_ml_vendas_comenvio_account 
  ON public.ml_vendas_comenvio(integration_account_id);

CREATE INDEX IF NOT EXISTS idx_ml_vendas_comenvio_date_created 
  ON public.ml_vendas_comenvio(date_created DESC);

CREATE INDEX IF NOT EXISTS idx_ml_vendas_comenvio_status 
  ON public.ml_vendas_comenvio(status);

CREATE INDEX IF NOT EXISTS idx_ml_vendas_comenvio_last_synced 
  ON public.ml_vendas_comenvio(last_synced_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.ml_vendas_comenvio ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver vendas da sua organização
CREATE POLICY "Users can view their organization vendas comenvio"
  ON public.ml_vendas_comenvio
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: Usuários podem inserir vendas da sua organização
CREATE POLICY "Users can insert their organization vendas comenvio"
  ON public.ml_vendas_comenvio
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: Usuários podem atualizar vendas da sua organização
CREATE POLICY "Users can update their organization vendas comenvio"
  ON public.ml_vendas_comenvio
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: Usuários podem deletar vendas da sua organização
CREATE POLICY "Users can delete their organization vendas comenvio"
  ON public.ml_vendas_comenvio
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_ml_vendas_comenvio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_ml_vendas_comenvio_updated_at
  BEFORE UPDATE ON public.ml_vendas_comenvio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ml_vendas_comenvio_updated_at();

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE public.ml_vendas_comenvio IS 'Tabela própria para página /vendas-canceladas-comenvio - isolada de ml_orders_cache';
COMMENT ON COLUMN public.ml_vendas_comenvio.order_data IS 'Dados completos do pedido do Mercado Livre em JSONB';
COMMENT ON COLUMN public.ml_vendas_comenvio.last_synced_at IS 'Última sincronização com API do Mercado Livre';