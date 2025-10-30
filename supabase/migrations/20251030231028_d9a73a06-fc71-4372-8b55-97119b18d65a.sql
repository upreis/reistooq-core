-- Atualizar função RPC para usar quantidade dinâmica
CREATE OR REPLACE FUNCTION public.baixar_insumos_pedido(p_insumos jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_sku text;
  v_quantidade int;
  v_produto record;
  v_total_processados int := 0;
  v_total_sucesso int := 0;
  v_erros jsonb := '[]'::jsonb;
  v_insumo jsonb;
BEGIN
  v_org_id := public.get_current_org_id();
  
  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organização não encontrada');
  END IF;

  -- Processar cada insumo com sua quantidade específica
  FOR v_insumo IN SELECT * FROM jsonb_array_elements(p_insumos)
  LOOP
    v_sku := v_insumo->>'sku';
    v_quantidade := COALESCE((v_insumo->>'quantidade')::int, 1); -- Padrão 1 se não informado
    v_total_processados := v_total_processados + 1;
    
    IF v_sku IS NULL OR v_sku = '' THEN
      v_erros := v_erros || jsonb_build_object('sku', v_sku, 'erro', 'SKU não informado');
      CONTINUE;
    END IF;
    
    -- Buscar produto (insumo no estoque)
    SELECT * INTO v_produto 
    FROM public.produtos 
    WHERE sku_interno = v_sku 
      AND organization_id = v_org_id 
      AND ativo = true;
    
    IF NOT FOUND THEN
      v_erros := v_erros || jsonb_build_object(
        'sku', v_sku, 
        'erro', format('Insumo "%s" não cadastrado no estoque', v_sku)
      );
      CONTINUE;
    END IF;
    
    -- Verificar estoque
    IF v_produto.quantidade_atual < v_quantidade THEN
      v_erros := v_erros || jsonb_build_object(
        'sku', v_sku, 
        'erro', format('Estoque insuficiente para insumo "%s". Disponível: %s, Necessário: %s', 
                       v_sku, v_produto.quantidade_atual, v_quantidade)
      );
      CONTINUE;
    END IF;
    
    -- Baixar a quantidade cadastrada
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
      'baixa_insumo_pedido',
      format('Baixa de insumo por pedido - SKU: %s - Qtd: %s', v_sku, v_quantidade)
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
$$;