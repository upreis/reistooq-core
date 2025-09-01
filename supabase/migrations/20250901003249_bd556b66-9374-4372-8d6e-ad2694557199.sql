-- ✅ CORREÇÃO: Remover índice problemático e recriar com hash para SKUs longos
DROP INDEX IF EXISTS idx_mapeamentos_depara_sku_pedido;

-- ✅ CRIAR ÍNDICE COM HASH para suportar SKUs longos
CREATE INDEX idx_mapeamentos_depara_sku_pedido_hash 
ON mapeamentos_depara USING hash (sku_pedido);

-- ✅ CRIAR ÍNDICE PARCIAL para melhor performance em consultas ativas
CREATE INDEX idx_mapeamentos_depara_sku_pedido_ativo 
ON mapeamentos_depara (sku_pedido) 
WHERE ativo = true;