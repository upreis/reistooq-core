-- ============================================================================
-- CORREÇÃO CRÍTICA: Função get_historico_venda_by_id retornando TODOS os campos
-- Problema: Função estava retornando apenas 19 campos, faltavam 50+ campos essenciais
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_historico_venda_by_id(uuid);

CREATE OR REPLACE FUNCTION public.get_historico_venda_by_id(p_id uuid)
RETURNS SETOF public.historico_vendas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Obter organização do usuário atual
  SELECT organizacao_id INTO v_org_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Se não encontrou organização, retornar vazio
  IF v_org_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Retornar TODOS os campos do registro se pertence à mesma organização
  RETURN QUERY
  SELECT hv.*
  FROM public.historico_vendas hv
  LEFT JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
  WHERE hv.id = p_id
  AND (
    -- Permitir se integration_account_id pertence à organização do usuário
    ia.organization_id = v_org_id
    OR
    -- OU se integration_account_id for NULL (registros antigos/importados)
    hv.integration_account_id IS NULL
  )
  LIMIT 1;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_historico_venda_by_id(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_historico_venda_by_id IS 'Busca registro completo do histórico de vendas com todos os campos, incluindo local_estoque_id necessário para reversão';