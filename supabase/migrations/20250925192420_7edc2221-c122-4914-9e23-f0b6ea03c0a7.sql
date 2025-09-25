-- Adicionar colunas de impostos na tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS pis numeric(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cofins numeric(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS imposto_importacao numeric(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ipi numeric(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS icms numeric(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ncm text,
ADD COLUMN IF NOT EXISTS cubagem_cm3 numeric(10,6);