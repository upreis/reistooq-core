-- Conceder permissões adequadas para as funções de exclusão do histórico
-- As funções foram atualizadas mas faltam as permissões corretas

-- 1. Garantir que as funções hv_delete e hv_delete_many estão com permissões corretas
GRANT EXECUTE ON FUNCTION public.hv_delete(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hv_delete_many(uuid[]) TO authenticated;

-- 2. Garantir que a função hv_exists também tem permissões corretas  
GRANT EXECUTE ON FUNCTION public.hv_exists(text) TO authenticated;

-- 3. Garantir que get_historico_vendas_safe tem permissões
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_safe(date, date, text, integer, integer) TO authenticated;