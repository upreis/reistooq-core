-- ✅ FASE 1.5: Adicionar campo return_id dedicado
-- Permite buscar e filtrar devoluções por return ID

ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS return_id TEXT NULL;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_devolucoes_return_id 
ON devolucoes_avancadas(return_id) 
WHERE return_id IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN devolucoes_avancadas.return_id IS 'ID único do return no Mercado Livre (extraído de dados_return.id)';
