-- ========================================
-- MIGRAÇÃO: COMPOSIÇÕES POR LOCAL DE ESTOQUE
-- ========================================

-- 1. Adicionar coluna local_id em produto_componentes
ALTER TABLE produto_componentes 
ADD COLUMN local_id UUID REFERENCES locais_estoque(id) ON DELETE CASCADE;

-- 2. Adicionar coluna local_id em composicoes_insumos
ALTER TABLE composicoes_insumos 
ADD COLUMN local_id UUID REFERENCES locais_estoque(id) ON DELETE CASCADE;

-- 3. Backfill: Associar composições existentes ao local principal de cada organização
UPDATE produto_componentes pc
SET local_id = (
  SELECT id 
  FROM locais_estoque 
  WHERE organization_id = pc.organization_id 
    AND tipo = 'principal'
  LIMIT 1
)
WHERE local_id IS NULL;

UPDATE composicoes_insumos ci
SET local_id = (
  SELECT id 
  FROM locais_estoque 
  WHERE organization_id = ci.organization_id 
    AND tipo = 'principal'
  LIMIT 1
)
WHERE local_id IS NULL;

-- 4. Tornar local_id obrigatório após backfill
ALTER TABLE produto_componentes 
ALTER COLUMN local_id SET NOT NULL;

ALTER TABLE composicoes_insumos 
ALTER COLUMN local_id SET NOT NULL;

-- 5. Criar índices para performance
CREATE INDEX idx_produto_componentes_local_id ON produto_componentes(local_id);
CREATE INDEX idx_composicoes_insumos_local_id ON composicoes_insumos(local_id);

-- 6. Criar índice composto para evitar duplicatas por local
CREATE UNIQUE INDEX idx_produto_componentes_unique_por_local 
ON produto_componentes(organization_id, sku_produto, sku_componente, local_id);

CREATE UNIQUE INDEX idx_composicoes_insumos_unique_por_local 
ON composicoes_insumos(organization_id, sku_produto, sku_insumo, local_id);