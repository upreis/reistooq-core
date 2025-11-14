-- Adicionar campos de custo de devolução na tabela devolucoes_avancadas
-- Estes campos armazenam os dados retornados do endpoint /claims/{claim_id}/charges/return-cost

ALTER TABLE devolucoes_avancadas
ADD COLUMN IF NOT EXISTS custo_devolucao_ml NUMERIC,
ADD COLUMN IF NOT EXISTS custo_devolucao_ml_usd NUMERIC,
ADD COLUMN IF NOT EXISTS moeda_custo_devolucao_ml TEXT DEFAULT 'BRL';

COMMENT ON COLUMN devolucoes_avancadas.custo_devolucao_ml IS 'Custo real de devolução cobrado pelo ML (do endpoint /charges/return-cost)';
COMMENT ON COLUMN devolucoes_avancadas.custo_devolucao_ml_usd IS 'Custo de devolução em USD (do endpoint /charges/return-cost com calculate_amount_usd=true)';
COMMENT ON COLUMN devolucoes_avancadas.moeda_custo_devolucao_ml IS 'Moeda do custo de devolução (geralmente BRL)';