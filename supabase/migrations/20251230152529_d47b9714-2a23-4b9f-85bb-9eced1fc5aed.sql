
-- Deletar o registro órfão específico do historico_vendas que está bloqueando a re-importação
DELETE FROM public.historico_vendas 
WHERE id = '146abf9b-f82d-4e44-8cf2-f2765d19de5d';

-- Criar função RPC para limpar registros órfãos do histórico
-- (registros que não têm pedido correspondente mas ainda bloqueiam re-importação)
CREATE OR REPLACE FUNCTION public.limpar_historico_orfao(p_numero_pedido TEXT)
RETURNS TABLE(deleted_id UUID, deleted_numero_pedido TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  DELETE FROM public.historico_vendas
  WHERE numero_pedido = p_numero_pedido
  RETURNING id, numero_pedido;
END;
$$;

-- Garantir acesso para usuários autenticados
GRANT EXECUTE ON FUNCTION public.limpar_historico_orfao(TEXT) TO authenticated;
