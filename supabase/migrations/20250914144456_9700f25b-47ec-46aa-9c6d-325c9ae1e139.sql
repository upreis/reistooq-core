-- Adicionar colunas para mensagens e ações
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS dados_mensagens JSONB,
ADD COLUMN IF NOT EXISTS dados_acoes JSONB;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'devolucoes_avancadas' 
AND column_name IN ('dados_mensagens', 'dados_acoes');