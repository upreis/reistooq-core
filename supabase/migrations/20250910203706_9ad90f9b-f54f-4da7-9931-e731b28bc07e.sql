-- Remover função duplicada que estava causando conflito
DROP FUNCTION IF EXISTS public.get_historico_vendas_safe(integer, integer, text, date, date, text, uuid);

-- Manter apenas a versão simples existente e garantir que funciona corretamente
-- A função get_historico_vendas_safe que delega para get_historico_vendas_masked já existe e funciona

-- Comentário: A página /historico agora deve funcionar corretamente