-- FASE 1: Adicionar campos para rastrear related_entities e returns associados

-- Adicionar colunas para armazenar related_entities do claim
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS related_entities JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS has_related_return BOOLEAN DEFAULT false;

-- Criar índice para buscar rapidamente claims com returns
CREATE INDEX IF NOT EXISTS idx_devolucoes_has_related_return 
ON devolucoes_avancadas(has_related_return) 
WHERE has_related_return = true;

-- Comentários explicativos
COMMENT ON COLUMN devolucoes_avancadas.related_entities IS 'Array de entidades relacionadas ao claim (ex: ["return", "review"])';
COMMENT ON COLUMN devolucoes_avancadas.has_related_return IS 'Flag rápida para indicar se o claim tem devolução relacionada';