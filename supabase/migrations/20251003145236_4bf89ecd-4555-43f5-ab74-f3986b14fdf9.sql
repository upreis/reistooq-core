-- Adicionar campo para tipo de container selecionado na tabela cotacoes_internacionais
ALTER TABLE cotacoes_internacionais 
ADD COLUMN IF NOT EXISTS container_tipo VARCHAR(10) DEFAULT '40';

-- Adicionar comentário explicativo
COMMENT ON COLUMN cotacoes_internacionais.container_tipo IS 'Tipo de container selecionado para a cotação: 20 ou 40';