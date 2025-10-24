-- ============================================
-- FASE 1: ENRIQUECIMENTO DE DADOS DE RETURNS
-- Adiciona campos detalhados de devolução
-- ============================================

-- Adicionar novas colunas para dados de returns na tabela devolucoes_avancadas
ALTER TABLE devolucoes_avancadas 
  ADD COLUMN IF NOT EXISTS status_devolucao TEXT,
  ADD COLUMN IF NOT EXISTS status_dinheiro TEXT,
  ADD COLUMN IF NOT EXISTS subtipo_devolucao TEXT,
  ADD COLUMN IF NOT EXISTS data_reembolso TIMESTAMPTZ;

-- Comentários para documentação
COMMENT ON COLUMN devolucoes_avancadas.status_devolucao IS 'Status da devolução física (pending, in_transit, delivered, cancelled, expired)';
COMMENT ON COLUMN devolucoes_avancadas.status_dinheiro IS 'Status do reembolso financeiro (refunded, pending, not_refunded)';
COMMENT ON COLUMN devolucoes_avancadas.subtipo_devolucao IS 'Subtipo da devolução (return_to_seller, return_to_buyer, etc)';
COMMENT ON COLUMN devolucoes_avancadas.data_reembolso IS 'Data em que o reembolso foi processado';