
-- ============================================
-- MIGRATION: Adicionar colunas JSONB agrupadas
-- Data: 2025-11-11
-- Objetivo: Adicionar campos JSONB para armazenar dados agrupados da API ML
-- ============================================

-- ✅ Adicionar 5 colunas JSONB faltantes
ALTER TABLE devolucoes_avancadas 
  ADD COLUMN IF NOT EXISTS dados_product_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dados_tracking_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dados_quantities JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dados_financial_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dados_buyer_info JSONB DEFAULT '{}'::jsonb;

-- ✅ Criar índices GIN para queries rápidas em campos JSONB
CREATE INDEX IF NOT EXISTS idx_devolucoes_product_info ON devolucoes_avancadas USING GIN (dados_product_info);
CREATE INDEX IF NOT EXISTS idx_devolucoes_tracking_info ON devolucoes_avancadas USING GIN (dados_tracking_info);
CREATE INDEX IF NOT EXISTS idx_devolucoes_quantities ON devolucoes_avancadas USING GIN (dados_quantities);
CREATE INDEX IF NOT EXISTS idx_devolucoes_financial_info ON devolucoes_avancadas USING GIN (dados_financial_info);
CREATE INDEX IF NOT EXISTS idx_devolucoes_buyer_info ON devolucoes_avancadas USING GIN (dados_buyer_info);

-- ✅ Comentários descritivos
COMMENT ON COLUMN devolucoes_avancadas.dados_product_info IS 'Informações do produto: item_id, variation_id, seller_sku, title';
COMMENT ON COLUMN devolucoes_avancadas.dados_tracking_info IS 'Rastreamento e status: tracking_number, carrier, shipment_status, shipment_type, destination';
COMMENT ON COLUMN devolucoes_avancadas.dados_quantities IS 'Quantidades: total_quantity, return_quantity, quantity_type';
COMMENT ON COLUMN devolucoes_avancadas.dados_financial_info IS 'Informações financeiras: refund_amount, currency, payment_method, shipping_cost';
COMMENT ON COLUMN devolucoes_avancadas.dados_buyer_info IS 'Informações do comprador: buyer_id, nickname, full_name, cpf';
