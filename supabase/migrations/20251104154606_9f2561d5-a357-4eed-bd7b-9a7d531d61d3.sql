-- Adicionar colunas de reputação do vendedor à tabela pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS power_seller_status TEXT,
ADD COLUMN IF NOT EXISTS level_id TEXT;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedidos_power_seller_status ON pedidos(power_seller_status);
CREATE INDEX IF NOT EXISTS idx_pedidos_level_id ON pedidos(level_id);

-- Adicionar comentários para documentação
COMMENT ON COLUMN pedidos.power_seller_status IS 'Status de Mercado Líder do vendedor (platinum, gold, silver)';
COMMENT ON COLUMN pedidos.level_id IS 'Nível de reputação do vendedor (ex: 5_green, 4_yellow)';