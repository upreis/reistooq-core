-- ✅ FASE 1: Adicionar colunas JSONB faltantes
-- Corrige o problema de dados incompletos (buyer_info, product_info, etc.)

-- Adicionar colunas JSONB que estão sendo salvas mas não existem
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS dados_buyer_info JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dados_product_info JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dados_financial_info JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dados_tracking_info JSONB DEFAULT NULL;

-- Criar índices GIN para performance em queries JSONB
CREATE INDEX IF NOT EXISTS idx_devolucoes_buyer_info 
ON devolucoes_avancadas USING GIN (dados_buyer_info);

CREATE INDEX IF NOT EXISTS idx_devolucoes_product_info 
ON devolucoes_avancadas USING GIN (dados_product_info);

CREATE INDEX IF NOT EXISTS idx_devolucoes_financial_info 
ON devolucoes_avancadas USING GIN (dados_financial_info);

CREATE INDEX IF NOT EXISTS idx_devolucoes_tracking_info 
ON devolucoes_avancadas USING GIN (dados_tracking_info);

-- Comentários para documentação
COMMENT ON COLUMN devolucoes_avancadas.dados_buyer_info IS 'Informações do comprador (nickname, email, reputação)';
COMMENT ON COLUMN devolucoes_avancadas.dados_product_info IS 'Informações do produto (título, SKU, categoria)';
COMMENT ON COLUMN devolucoes_avancadas.dados_financial_info IS 'Informações financeiras (valores, reembolsos)';
COMMENT ON COLUMN devolucoes_avancadas.dados_tracking_info IS 'Informações de rastreamento (código, transportadora)';
