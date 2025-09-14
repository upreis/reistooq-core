-- Adicionar colunas de cronograma à tabela devolucoes_avancadas
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS cronograma_tipo text,
ADD COLUMN IF NOT EXISTS cronograma_status text;