-- Adicionar colunas faltantes para mapeamento completo da planilha Shopee
ALTER TABLE public.pedidos_shopee 
ADD COLUMN IF NOT EXISTS endereco_bairro TEXT,
ADD COLUMN IF NOT EXISTS codigo_rastreamento TEXT,
ADD COLUMN IF NOT EXISTS custo_envio NUMERIC,
ADD COLUMN IF NOT EXISTS custo_fixo NUMERIC,
ADD COLUMN IF NOT EXISTS receita_flex NUMERIC,
ADD COLUMN IF NOT EXISTS taxa_marketplace NUMERIC,
ADD COLUMN IF NOT EXISTS tipo_logistico TEXT,
ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;