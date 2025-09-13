-- Corrigir conflito na função count_baixados
-- Remover todas as versões da função e criar uma versão unificada

DROP FUNCTION IF EXISTS public.count_baixados(uuid[], date, date, text);
DROP FUNCTION IF EXISTS public.count_baixados(uuid[], text, text, text);

-- Criar função unificada que aceita datas como text (mais flexível)
CREATE OR REPLACE FUNCTION public.count_baixados(
  _account_ids uuid[],
  _from text DEFAULT NULL,
  _to text DEFAULT NULL,
  _search text DEFAULT NULL
) RETURNS integer AS $$
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
        hv.pedido_numero ILIKE '%' || _search || '%'
        OR hv.cliente_nome ILIKE '%' || _search || '%'
        OR hv.produto_titulo ILIKE '%' || _search || '%'
      )
      ELSE TRUE
    END;

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;