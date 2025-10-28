-- Adicionar colunas de dados do pedido na tabela reclamacoes
ALTER TABLE public.reclamacoes 
ADD COLUMN IF NOT EXISTS order_status_detail text,
ADD COLUMN IF NOT EXISTS order_date_created timestamp with time zone,
ADD COLUMN IF NOT EXISTS order_item_title text,
ADD COLUMN IF NOT EXISTS order_item_quantity integer,
ADD COLUMN IF NOT EXISTS order_item_unit_price numeric(10,2),
ADD COLUMN IF NOT EXISTS order_item_seller_sku text;