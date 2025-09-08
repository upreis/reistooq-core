-- Excluir função duplicada get_pedidos_masked simplificada
-- Manter apenas a principal com assinatura completa
DROP FUNCTION IF EXISTS public.get_pedidos_masked(uuid, text, text, text, integer, integer);