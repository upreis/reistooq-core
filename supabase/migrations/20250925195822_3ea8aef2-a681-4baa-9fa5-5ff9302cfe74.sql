-- Remover constraint de unicidade do código de barras
DROP INDEX IF EXISTS produtos_codigo_barras_unique_idx;

-- Manter apenas a constraint de unicidade do SKU (se não existir)
CREATE UNIQUE INDEX IF NOT EXISTS produtos_sku_unico_org 
ON produtos (sku_interno, organization_id) 
WHERE ativo = true;