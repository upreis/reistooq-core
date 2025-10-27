-- ============================================
-- ADICIONAR COLUNAS DE IMPACTO FINANCEIRO
-- ============================================

-- 1. Adicionar coluna de impacto financeiro (texto)
ALTER TABLE reclamacoes
ADD COLUMN IF NOT EXISTS impacto_financeiro TEXT;

-- 2. Adicionar coluna de valor do impacto (numérico)
ALTER TABLE reclamacoes
ADD COLUMN IF NOT EXISTS valor_impacto NUMERIC(10, 2) DEFAULT 0;

-- 3. Adicionar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_reclamacoes_impacto
ON reclamacoes(impacto_financeiro);

-- ============================================
-- CALCULAR IMPACTO PARA DADOS EXISTENTES
-- ============================================

-- Atualizar impacto para claims fechados onde comprador ganhou E ML cobriu
UPDATE reclamacoes
SET
  impacto_financeiro = 'coberto_ml',
  valor_impacto = 0
WHERE
  status = 'closed'
  AND resolution_benefited = 'complainant'
  AND resolution_applied_coverage = true;

-- Atualizar impacto para claims fechados onde comprador ganhou E ML NÃO cobriu
UPDATE reclamacoes
SET
  impacto_financeiro = 'perda',
  valor_impacto = -COALESCE(amount_value, 0)
WHERE
  status = 'closed'
  AND resolution_benefited = 'complainant'
  AND (resolution_applied_coverage = false OR resolution_applied_coverage IS NULL);

-- Atualizar impacto para claims fechados onde vendedor ganhou
UPDATE reclamacoes
SET
  impacto_financeiro = 'ganho',
  valor_impacto = COALESCE(amount_value, 0)
WHERE
  status = 'closed'
  AND resolution_benefited = 'respondent';

-- Atualizar impacto para claims ainda abertos
UPDATE reclamacoes
SET
  impacto_financeiro = 'neutro',
  valor_impacto = 0
WHERE
  status != 'closed'
  OR resolution_benefited IS NULL;