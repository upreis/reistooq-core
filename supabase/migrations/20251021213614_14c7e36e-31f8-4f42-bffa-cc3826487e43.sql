-- 📦 FASE 2: Adicionar campos JSONB para novos dados de shipments
-- SAFE: Apenas adiciona colunas opcionais, não afeta dados existentes

-- Adicionar campo para dados de reviews
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS dados_reviews jsonb DEFAULT NULL;

-- Adicionar campo para dados de custos de envio
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS dados_costs jsonb DEFAULT NULL;

-- Adicionar campo para dados detalhados de reasons
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS dados_reasons jsonb DEFAULT NULL;

-- Comentários para documentação
COMMENT ON COLUMN devolucoes_avancadas.dados_reviews IS 'Armazena dados completos de reviews da API /returns/{id}/reviews';
COMMENT ON COLUMN devolucoes_avancadas.dados_costs IS 'Armazena dados completos de custos de envio da API /shipments/{id}/costs';
COMMENT ON COLUMN devolucoes_avancadas.dados_reasons IS 'Armazena dados detalhados de reasons da API /returns/reasons/{id}';

-- Criar índices GIN para busca eficiente em JSONB (opcional mas recomendado)
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_reviews ON devolucoes_avancadas USING GIN (dados_reviews);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_costs ON devolucoes_avancadas USING GIN (dados_costs);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_reasons ON devolucoes_avancadas USING GIN (dados_reasons);