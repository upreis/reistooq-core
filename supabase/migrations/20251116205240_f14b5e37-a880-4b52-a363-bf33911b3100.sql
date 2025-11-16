-- Adicionar coluna product_info na tabela reclamacoes
-- Essa coluna armazena informações do produto (thumbnail, título, preço, SKU, etc)

ALTER TABLE reclamacoes 
ADD COLUMN IF NOT EXISTS product_info jsonb DEFAULT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN reclamacoes.product_info IS 'Informações do produto (id, title, price, thumbnail, permalink, sku, etc) obtidas da API do Mercado Livre';