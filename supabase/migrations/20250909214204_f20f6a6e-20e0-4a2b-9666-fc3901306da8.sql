-- 🛡️ Criar função hv_exists para verificar se pedido já foi processado
CREATE OR REPLACE FUNCTION public.hv_exists(p_id_unico text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.historico_vendas 
    WHERE id_unico = p_id_unico 
    AND status IN ('baixado', 'concluida')
  );
$function$;