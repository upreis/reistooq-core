-- Função RPC para verificar se um pedido já existe no histórico (evita duplicação)
CREATE OR REPLACE FUNCTION public.hv_exists(p_id_unico text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.historico_vendas 
    WHERE id_unico = p_id_unico 
    AND created_by = auth.uid()
  );
END;
$$;