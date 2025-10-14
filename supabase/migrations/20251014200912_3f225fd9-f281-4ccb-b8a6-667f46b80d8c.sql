-- 🎯 FASE 4: IMPLEMENTAÇÃO REASONS API
-- Adicionar 8 colunas de motivos detalhados das reclamações

ALTER TABLE devolucoes_avancadas
ADD COLUMN IF NOT EXISTS reason_id text,
ADD COLUMN IF NOT EXISTS reason_detail text,
ADD COLUMN IF NOT EXISTS reason_name text,
ADD COLUMN IF NOT EXISTS reason_category text,
ADD COLUMN IF NOT EXISTS reason_expected_resolutions text[],
ADD COLUMN IF NOT EXISTS reason_rules_engine text[],
ADD COLUMN IF NOT EXISTS reason_priority text,
ADD COLUMN IF NOT EXISTS reason_type text;

-- Criar índices para busca otimizada
CREATE INDEX IF NOT EXISTS idx_devolucoes_reason_category
ON devolucoes_avancadas(reason_category);

CREATE INDEX IF NOT EXISTS idx_devolucoes_reason_priority
ON devolucoes_avancadas(reason_priority);

CREATE INDEX IF NOT EXISTS idx_devolucoes_reason_type
ON devolucoes_avancadas(reason_type);

-- Comentários para documentação
COMMENT ON COLUMN devolucoes_avancadas.reason_id IS 'ID do motivo da reclamação (ex: PD09939)';
COMMENT ON COLUMN devolucoes_avancadas.reason_detail IS 'Descrição detalhada do motivo';
COMMENT ON COLUMN devolucoes_avancadas.reason_name IS 'Nome técnico do motivo (ex: repentant_buyer)';
COMMENT ON COLUMN devolucoes_avancadas.reason_category IS 'Categoria: arrependimento, defeito, diferente, incompleto';
COMMENT ON COLUMN devolucoes_avancadas.reason_expected_resolutions IS 'Array de resoluções esperadas';
COMMENT ON COLUMN devolucoes_avancadas.reason_rules_engine IS 'Array de regras do motor';
COMMENT ON COLUMN devolucoes_avancadas.reason_priority IS 'Prioridade: low, medium, high';
COMMENT ON COLUMN devolucoes_avancadas.reason_type IS 'Tipo: buyer_initiated, seller_initiated, ml_initiated';