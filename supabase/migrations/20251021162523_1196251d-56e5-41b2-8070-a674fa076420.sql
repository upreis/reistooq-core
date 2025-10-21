-- Adicionar coluna acao_seller_necessaria à tabela devolucoes_avancadas
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS acao_seller_necessaria text;

-- Adicionar comentário explicativo
COMMENT ON COLUMN devolucoes_avancadas.acao_seller_necessaria IS 'Indica se o vendedor precisa tomar alguma ação específica na devolução (ex: autorizar, enviar produto substituto, etc.)';