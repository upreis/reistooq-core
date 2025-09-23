-- Atualizar constraint de status na tabela pedidos_compra para incluir o novo status
ALTER TABLE public.pedidos_compra 
DROP CONSTRAINT IF EXISTS pedidos_compra_status_check;

ALTER TABLE public.pedidos_compra 
ADD CONSTRAINT pedidos_compra_status_check 
CHECK (status IN ('pendente', 'aprovado', 'em_andamento', 'concluido_recebido', 'cancelado'));