-- Adicionar colunas Flex ao banco de dados pedidos
-- Esses campos vêm da API do Mercado Livre /shipments/{id}/costs

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS flex_order_cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS flex_special_discount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS flex_net_cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS flex_logistic_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS receita_flex NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN public.pedidos.flex_order_cost IS 'Custo bruto do pedido Flex (gross_amount da API ML)';
COMMENT ON COLUMN public.pedidos.flex_special_discount IS 'Desconto especial Loyal aplicado pelo comprador no Flex';
COMMENT ON COLUMN public.pedidos.flex_net_cost IS 'Custo líquido Flex (order_cost - special_discount)';
COMMENT ON COLUMN public.pedidos.flex_logistic_type IS 'Tipo de logística (self_service, cross_docking, etc)';
COMMENT ON COLUMN public.pedidos.receita_flex IS 'Receita que o seller recebe do ML por fazer entrega Flex';