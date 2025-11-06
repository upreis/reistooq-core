-- ============================================================================
-- ADIÇÃO DE COLUNAS FALTANTES EM HISTORICO_VENDAS
-- Garantindo que TODOS os campos da fotografia sejam salvos
-- ============================================================================

-- ===== PRODUTOS (5 novas colunas) =====
ALTER TABLE historico_vendas ADD COLUMN IF NOT EXISTS titulo_anuncio TEXT;
ALTER TABLE historico_vendas ADD COLUMN IF NOT EXISTS conditions TEXT;
ALTER TABLE historico_vendas ADD COLUMN IF NOT EXISTS shipping_substatus TEXT;
ALTER TABLE historico_vendas ADD COLUMN IF NOT EXISTS logistic_type TEXT;
ALTER TABLE historico_vendas ADD COLUMN IF NOT EXISTS status_insumos TEXT;

-- ===== FINANCEIROS (2 novas colunas) =====
ALTER TABLE historico_vendas ADD COLUMN IF NOT EXISTS custo_fixo_meli DECIMAL(10,2) DEFAULT 0;
ALTER TABLE historico_vendas ADD COLUMN IF NOT EXISTS marketplace_origem TEXT;

-- ===== MERCADO LIVRE ESPECÍFICO (2 novas colunas) =====
ALTER TABLE historico_vendas ADD COLUMN IF NOT EXISTS power_seller_status TEXT;
ALTER TABLE historico_vendas ADD COLUMN IF NOT EXISTS level_id TEXT;

-- ===== SHIPPING (campos que faltam) =====
ALTER TABLE historico_vendas ADD COLUMN IF NOT EXISTS shipping_shipping_status TEXT;

-- ===== METADADOS (1 nova coluna) =====
ALTER TABLE historico_vendas ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- ===== COMENTÁRIOS EXPLICATIVOS =====
COMMENT ON COLUMN historico_vendas.titulo_anuncio IS 'Título do anúncio no marketplace';
COMMENT ON COLUMN historico_vendas.conditions IS 'Condição do produto: new, used, refurbished';
COMMENT ON COLUMN historico_vendas.shipping_substatus IS 'Substatus detalhado do envio (printed, picked_up, etc)';
COMMENT ON COLUMN historico_vendas.logistic_type IS 'Tipo de logística (fulfillment, etc)';
COMMENT ON COLUMN historico_vendas.status_insumos IS 'Status de validação de insumos/matéria-prima';
COMMENT ON COLUMN historico_vendas.custo_fixo_meli IS 'Custo fixo de R$ 6 para pedidos abaixo de R$ 79';
COMMENT ON COLUMN historico_vendas.marketplace_origem IS 'Marketplace de origem: ML, Shopee, Tiny, Interno';
COMMENT ON COLUMN historico_vendas.power_seller_status IS 'Status de power seller: Platinum, Gold, Silver';
COMMENT ON COLUMN historico_vendas.level_id IS 'Nível de reputação do vendedor';
COMMENT ON COLUMN historico_vendas.shipping_shipping_status IS 'Status de envio traduzido';
COMMENT ON COLUMN historico_vendas.raw_data IS 'Backup dos dados originais completos do pedido';

-- ===== ÍNDICES PARA PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_historico_vendas_marketplace_origem ON historico_vendas(marketplace_origem);
CREATE INDEX IF NOT EXISTS idx_historico_vendas_conditions ON historico_vendas(conditions);
CREATE INDEX IF NOT EXISTS idx_historico_vendas_power_seller ON historico_vendas(power_seller_status);