-- Adicionar novas colunas para enriquecimento de dados das devoluções ML
ALTER TABLE ml_devolucoes_reclamacoes 
ADD COLUMN IF NOT EXISTS dados_claim JSONB,
ADD COLUMN IF NOT EXISTS dados_mensagens JSONB,
ADD COLUMN IF NOT EXISTS dados_return JSONB;