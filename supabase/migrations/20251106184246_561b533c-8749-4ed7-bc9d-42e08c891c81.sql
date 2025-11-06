
-- Adicionar colunas de local de estoque na tabela historico_vendas
-- Essencial para reversão correta de estoque ao excluir registros do histórico

-- Adicionar coluna local_estoque_id (UUID com FK)
ALTER TABLE historico_vendas 
ADD COLUMN IF NOT EXISTS local_estoque_id UUID;

-- Adicionar coluna local_estoque_nome (nome do local)
ALTER TABLE historico_vendas 
ADD COLUMN IF NOT EXISTS local_estoque_nome TEXT;

-- Adicionar coluna local_estoque (nome alternativo/legado)
ALTER TABLE historico_vendas 
ADD COLUMN IF NOT EXISTS local_estoque TEXT;

-- Adicionar foreign key para locais_estoque
ALTER TABLE historico_vendas
ADD CONSTRAINT fk_historico_vendas_local_estoque
FOREIGN KEY (local_estoque_id) 
REFERENCES locais_estoque(id)
ON DELETE SET NULL;

-- Adicionar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_historico_vendas_local_estoque_id 
ON historico_vendas(local_estoque_id);

-- Comentários para documentação
COMMENT ON COLUMN historico_vendas.local_estoque_id IS 'ID do local de estoque de onde os produtos foram retirados (CRÍTICO para reversão)';
COMMENT ON COLUMN historico_vendas.local_estoque_nome IS 'Nome do local de estoque (snapshot no momento da baixa)';
COMMENT ON COLUMN historico_vendas.local_estoque IS 'Nome do local de estoque (campo legado/alternativo)';
