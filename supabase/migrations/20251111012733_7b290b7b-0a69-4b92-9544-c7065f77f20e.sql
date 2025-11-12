-- Adicionar colunas faltantes na tabela produtos
-- Estas colunas são usadas nos formulários de criação de produtos
-- mas não existem na estrutura atual do banco de dados

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS peso_bruto_kg numeric,
  ADD COLUMN IF NOT EXISTS peso_liquido_kg numeric,
  ADD COLUMN IF NOT EXISTS dias_preparacao integer,
  ADD COLUMN IF NOT EXISTS tipo_embalagem text,
  ADD COLUMN IF NOT EXISTS codigo_cest text,
  ADD COLUMN IF NOT EXISTS origem integer,
  ADD COLUMN IF NOT EXISTS sob_encomenda boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS numero_volumes integer DEFAULT 1;

-- Adicionar comentários descritivos para documentação
COMMENT ON COLUMN produtos.peso_bruto_kg IS 'Peso bruto do produto em quilogramas (incluindo embalagem)';
COMMENT ON COLUMN produtos.peso_liquido_kg IS 'Peso líquido do produto em quilogramas (sem embalagem)';
COMMENT ON COLUMN produtos.dias_preparacao IS 'Número de dias necessários para preparar o produto antes do envio';
COMMENT ON COLUMN produtos.tipo_embalagem IS 'Tipo de embalagem do produto (ex: caixa, envelope, pallet)';
COMMENT ON COLUMN produtos.codigo_cest IS 'Código CEST (Código Especificador da Substituição Tributária) para tributação';
COMMENT ON COLUMN produtos.origem IS 'Código de origem do produto (0-Nacional, 1-Estrangeira importação direta, etc)';
COMMENT ON COLUMN produtos.sob_encomenda IS 'Indica se o produto é fabricado/adquirido sob encomenda';
COMMENT ON COLUMN produtos.numero_volumes IS 'Número de volumes/caixas que compõem o produto';

-- Criar índices para melhorar performance de queries comuns
CREATE INDEX IF NOT EXISTS idx_produtos_sob_encomenda ON produtos(sob_encomenda) WHERE sob_encomenda = true;
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_cest ON produtos(codigo_cest) WHERE codigo_cest IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_origem ON produtos(origem) WHERE origem IS NOT NULL;