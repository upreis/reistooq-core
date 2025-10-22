-- Remove colunas anexos_comprador e anexos_vendedor que não são mais usadas
ALTER TABLE public.pedidos_cancelados_ml 
DROP COLUMN IF EXISTS anexos_comprador,
DROP COLUMN IF EXISTS anexos_vendedor;