-- Adicionar colunas de código e descrição do status da order
ALTER TABLE public.reclamacoes 
ADD COLUMN IF NOT EXISTS order_status_code text,
ADD COLUMN IF NOT EXISTS order_status_description text;