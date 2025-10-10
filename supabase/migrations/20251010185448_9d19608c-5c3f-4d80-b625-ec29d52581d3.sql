-- ============================================================================
-- MIGRAÇÃO: Adicionar validação de existência de produto na função baixar_estoque_direto
-- Data: 2025-10-10
-- Objetivo: Garantir que NUNCA seja possível baixar estoque de produtos não cadastrados
-- ============================================================================

-- Recriar a função baixar_estoque_direto com validação de existência
CREATE OR REPLACE FUNCTION public.baixar_estoque_direto(p_baixas jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid;
  v_sku text;
  v_quantidade int;
  v_produto record;
  v_total_processados int := 0;
  v_total_sucesso int := 0;
  v_erros jsonb := '[]'::jsonb;
  v_baixa jsonb;
BEGIN
  -- Obter organização atual
  v_org_id := public.get_current_org_id();
  
  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organização não encontrada');
  END IF;

  -- Processar cada baixa no array
  FOR v_baixa IN SELECT * FROM jsonb_array_elements(p_baixas)
  LOOP
    v_sku := v_baixa->>'sku';
    v_quantidade := COALESCE((v_baixa->>'quantidade')::int, 0);
    v_total_processados := v_total_processados + 1;
    
    -- Validar dados
    IF v_sku IS NULL OR v_sku = '' THEN
      v_erros := v_erros || jsonb_build_object('sku', v_sku, 'erro', 'SKU não informado');
      CONTINUE;
    END IF;
    
    IF v_quantidade <= 0 THEN
      v_erros := v_erros || jsonb_build_object('sku', v_sku, 'erro', 'Quantidade deve ser maior que zero');
      CONTINUE;
    END IF;
    
    -- 🛡️ VALIDAÇÃO CRÍTICA: Buscar produto pelo SKU E VERIFICAR EXISTÊNCIA
    SELECT * INTO v_produto 
    FROM public.produtos 
    WHERE sku_interno = v_sku 
      AND organization_id = v_org_id 
      AND ativo = true;
    
    -- 🛡️ BLOQUEIO: Se produto não existe, retornar erro específico
    IF NOT FOUND THEN
      v_erros := v_erros || jsonb_build_object(
        'sku', v_sku, 
        'erro', format('SKU não está cadastrado no estoque. Por favor, cadastre o produto "%s" antes de fazer a baixa.', v_sku)
      );
      CONTINUE;
    END IF;
    
    -- Verificar se tem estoque suficiente
    IF v_produto.quantidade_atual < v_quantidade THEN
      v_erros := v_erros || jsonb_build_object(
        'sku', v_sku, 
        'erro', format('Estoque insuficiente. Disponível: %s, Solicitado: %s', v_produto.quantidade_atual, v_quantidade)
      );
      CONTINUE;
    END IF;
    
    -- Fazer a baixa do estoque
    UPDATE public.produtos 
    SET quantidade_atual = quantidade_atual - v_quantidade,
        updated_at = now()
    WHERE id = v_produto.id;
    
    -- Registrar movimentação
    INSERT INTO public.movimentacoes_estoque (
      produto_id, 
      tipo_movimentacao, 
      quantidade_anterior, 
      quantidade_nova, 
      quantidade_movimentada,
      motivo,
      observacoes
    ) VALUES (
      v_produto.id,
      'saida',
      v_produto.quantidade_atual,
      v_produto.quantidade_atual - v_quantidade,
      v_quantidade,
      'baixa_pedido',
      format('Baixa automática por pedido - SKU: %s', v_sku)
    );
    
    v_total_sucesso := v_total_sucesso + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', v_total_sucesso > 0,
    'total_processados', v_total_processados,
    'total_sucesso', v_total_sucesso,
    'total_erros', v_total_processados - v_total_sucesso,
    'erros', v_erros
  );
END;
$function$;