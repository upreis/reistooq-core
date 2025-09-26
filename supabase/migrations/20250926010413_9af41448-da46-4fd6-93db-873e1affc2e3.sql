-- Primeira etapa: Limpar SKUs duplicados mantendo apenas o mais recente
WITH duplicated_skus AS (
  SELECT sku_interno, organization_id
  FROM produtos 
  WHERE organization_id IS NOT NULL
  GROUP BY sku_interno, organization_id
  HAVING COUNT(*) > 1
),
products_to_keep AS (
  SELECT DISTINCT ON (p.sku_interno, p.organization_id) p.id
  FROM produtos p
  INNER JOIN duplicated_skus d ON p.sku_interno = d.sku_interno 
    AND p.organization_id = d.organization_id
  ORDER BY p.sku_interno, p.organization_id, p.updated_at DESC
)
DELETE FROM produtos 
WHERE sku_interno IN (SELECT sku_interno FROM duplicated_skus)
  AND organization_id IN (SELECT organization_id FROM duplicated_skus)
  AND id NOT IN (SELECT id FROM products_to_keep);

-- Segunda etapa: Criar constraint única para evitar duplicatas futuras
ALTER TABLE produtos 
ADD CONSTRAINT produtos_sku_interno_org_unique 
UNIQUE (sku_interno, organization_id);

-- Terceira etapa: Criar índice para melhorar performance das consultas por SKU
CREATE INDEX IF NOT EXISTS idx_produtos_sku_interno_org 
ON produtos(sku_interno, organization_id) 
WHERE ativo = true;