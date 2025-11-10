-- ============================================
-- FASE 4 - SEMANA 2: OTIMIZAÇÃO DE ÍNDICES JSONB
-- ============================================
-- Criar índices GIN para melhorar performance de queries JSONB
-- Índices GIN são ideais para buscas em estruturas JSONB

-- 1. Índice para dados_review (queries de status de revisão)
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_review_gin 
  ON devolucoes_avancadas USING GIN (dados_review);

-- 2. Índice para dados_comunicacao (queries de mensagens)
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_comunicacao_gin 
  ON devolucoes_avancadas USING GIN (dados_comunicacao);

-- 3. Índice para dados_deadlines (queries de prazos críticos) - CRÍTICO
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_deadlines_gin 
  ON devolucoes_avancadas USING GIN (dados_deadlines);

-- 4. Índice para dados_acoes_disponiveis (queries de ações)
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_acoes_gin 
  ON devolucoes_avancadas USING GIN (dados_acoes_disponiveis);

-- 5. Índice para dados_custos_logistica (queries de custos)
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_custos_gin 
  ON devolucoes_avancadas USING GIN (dados_custos_logistica);

-- 6. Índice para dados_fulfillment (queries de logística)
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_fulfillment_gin 
  ON devolucoes_avancadas USING GIN (dados_fulfillment);

-- 7. Índice para dados_lead_time (queries de lead time)
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_lead_time_gin 
  ON devolucoes_avancadas USING GIN (dados_lead_time);

-- 8. Índice para dados_available_actions
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_available_actions_gin 
  ON devolucoes_avancadas USING GIN (dados_available_actions);

-- 9. Índice para dados_shipping_costs
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_shipping_costs_gin 
  ON devolucoes_avancadas USING GIN (dados_shipping_costs);

-- 10. Índice para dados_refund_info
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_refund_info_gin 
  ON devolucoes_avancadas USING GIN (dados_refund_info);

-- 11. Índice para dados_product_condition
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_product_condition_gin 
  ON devolucoes_avancadas USING GIN (dados_product_condition);

-- ============================================
-- ÍNDICES ESPECÍFICOS PARA QUERIES FREQUENTES
-- ============================================

-- Índice para buscar deadlines críticos (query mais frequente)
CREATE INDEX IF NOT EXISTS idx_devolucoes_deadlines_critical 
  ON devolucoes_avancadas ((dados_deadlines->>'is_critical'))
  WHERE dados_deadlines->>'is_critical' = 'true';

-- Índice para buscar por status de revisão
CREATE INDEX IF NOT EXISTS idx_devolucoes_review_status 
  ON devolucoes_avancadas ((dados_review->>'review_status'))
  WHERE dados_review IS NOT NULL;

-- Índice para buscar por tipo de logística
CREATE INDEX IF NOT EXISTS idx_devolucoes_fulfillment_type 
  ON devolucoes_avancadas ((dados_fulfillment->>'tipo_logistica'))
  WHERE dados_fulfillment IS NOT NULL;

-- Índice para buscar por deadline de shipment
CREATE INDEX IF NOT EXISTS idx_devolucoes_shipment_deadline 
  ON devolucoes_avancadas ((dados_deadlines->>'shipment_deadline'))
  WHERE dados_deadlines->>'shipment_deadline' IS NOT NULL;

-- Índice para buscar por deadline de revisão
CREATE INDEX IF NOT EXISTS idx_devolucoes_review_deadline 
  ON devolucoes_avancadas ((dados_deadlines->>'seller_review_deadline'))
  WHERE dados_deadlines->>'seller_review_deadline' IS NOT NULL;

-- ============================================
-- ÍNDICES COMPOSTOS PARA QUERIES COMPLEXAS
-- ============================================

-- Índice composto para filtrar por integration_account_id e status de análise
CREATE INDEX IF NOT EXISTS idx_devolucoes_account_status_analise 
  ON devolucoes_avancadas (integration_account_id, status_analise)
  WHERE status_analise IS NOT NULL;

-- Índice composto para filtrar por conta e data
CREATE INDEX IF NOT EXISTS idx_devolucoes_account_data 
  ON devolucoes_avancadas (integration_account_id, created_at DESC);

-- Índice para buscar devoluções com deadlines críticos por conta
CREATE INDEX IF NOT EXISTS idx_devolucoes_account_critical 
  ON devolucoes_avancadas (integration_account_id)
  WHERE dados_deadlines->>'is_critical' = 'true';

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON INDEX idx_devolucoes_dados_review_gin IS 
  'Índice GIN para melhorar performance de queries em dados_review';

COMMENT ON INDEX idx_devolucoes_dados_deadlines_gin IS 
  'Índice GIN para melhorar performance de queries em dados_deadlines - CRÍTICO para alertas';

COMMENT ON INDEX idx_devolucoes_deadlines_critical IS 
  'Índice parcial para buscar rapidamente deadlines críticos (< 48h)';

COMMENT ON INDEX idx_devolucoes_review_status IS 
  'Índice parcial para buscar rapidamente por status de revisão';

COMMENT ON INDEX idx_devolucoes_fulfillment_type IS 
  'Índice parcial para filtrar por tipo de logística (FBM, FULL, FLEX, etc)';

COMMENT ON INDEX idx_devolucoes_account_status_analise IS 
  'Índice composto para filtrar devoluções por conta e status de análise';

COMMENT ON INDEX idx_devolucoes_account_critical IS 
  'Índice parcial para buscar rapidamente devoluções críticas por conta';
