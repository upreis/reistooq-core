-- Adicionar coluna shipping_state na tabela vendas_hoje_realtime
ALTER TABLE vendas_hoje_realtime 
ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(2);

-- Criar índice para performance nas queries por estado
CREATE INDEX IF NOT EXISTS idx_vendas_hoje_realtime_shipping_state 
ON vendas_hoje_realtime(shipping_state);

-- Comentário para documentação
COMMENT ON COLUMN vendas_hoje_realtime.shipping_state IS 'UF do estado de destino do envio (ex: SP, RJ, MG)';