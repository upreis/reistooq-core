-- ✅ Adicionar campo data_chegada_produto para armazenar data de chegada do produto
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS data_chegada_produto timestamp with time zone;

COMMENT ON COLUMN devolucoes_avancadas.data_chegada_produto IS 'Data de chegada do produto no destino (warehouse ou vendedor)';