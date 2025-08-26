-- Criar função para verificar se um pedido já foi processado (existe no histórico)
CREATE OR REPLACE FUNCTION public.hv_exists(p_id_unico text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.historico_vendas 
    WHERE id_unico = p_id_unico
  );
$$;

-- Criar função para verificar múltiplos pedidos de uma vez (performance)
CREATE OR REPLACE FUNCTION public.hv_exists_many(p_ids_unicos text[])
RETURNS TABLE(id_unico text, exists boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    unnest.id_unico,
    EXISTS (
      SELECT 1 FROM public.historico_vendas hv 
      WHERE hv.id_unico = unnest.id_unico
    ) as exists
  FROM unnest(p_ids_unicos) AS unnest(id_unico);
$$;

-- Adicionar coluna meta para campos extras no histórico
ALTER TABLE public.historico_vendas 
ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;

-- Comentar a coluna meta
COMMENT ON COLUMN public.historico_vendas.meta IS 'Campos extras como dados de pagamento, logística detalhada, etc.';

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.hv_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hv_exists_many(text[]) TO authenticated;