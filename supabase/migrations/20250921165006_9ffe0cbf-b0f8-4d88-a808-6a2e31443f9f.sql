-- Corrigir função count_baixados - erro na coluna pedido_numero
CREATE OR REPLACE FUNCTION public.count_baixados(_account_ids uuid[], _from text DEFAULT NULL::text, _to text DEFAULT NULL::text, _search text DEFAULT NULL::text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  count_result integer;
BEGIN
  -- Contar registros na tabela historico_vendas
  SELECT COUNT(*)
  INTO count_result
  FROM historico_vendas hv
  WHERE 
    CASE 
      WHEN _account_ids IS NOT NULL AND array_length(_account_ids, 1) > 0 
      THEN hv.integration_account_id = ANY(_account_ids)
      ELSE TRUE
    END
    AND CASE 
      WHEN _from IS NOT NULL 
      THEN hv.created_at >= _from::timestamp
      ELSE TRUE
    END
    AND CASE 
      WHEN _to IS NOT NULL 
      THEN hv.created_at <= _to::timestamp
      ELSE TRUE
    END
    AND CASE 
      WHEN _search IS NOT NULL AND _search != ''
      THEN (
        hv.numero_pedido ILIKE '%' || _search || '%'  -- ✅ CORRIGIDO: era pedido_numero
        OR hv.cliente_nome ILIKE '%' || _search || '%'
        OR hv.titulo_produto ILIKE '%' || _search || '%'
      )
      ELSE TRUE
    END;

  RETURN COALESCE(count_result, 0);
END;
$function$;