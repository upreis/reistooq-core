-- Renomear coluna data_finalizacao_timeline para data_fechamento_claim
ALTER TABLE devolucoes_avancadas RENAME COLUMN data_finalizacao_timeline TO data_fechamento_claim;

-- Remover coluna eventos_sistema (não vem da API, é gerado)
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS eventos_sistema;