-- Adicionar coluna sku_pai na tabela produtos
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS sku_pai TEXT;

-- Criar índice para melhorar performance de busca por SKU pai
CREATE INDEX IF NOT EXISTS idx_produtos_sku_pai ON produtos(sku_pai);

-- Adicionar comentário explicativo
COMMENT ON COLUMN produtos.sku_pai IS 'SKU do produto pai quando este é uma variação (filho)';
