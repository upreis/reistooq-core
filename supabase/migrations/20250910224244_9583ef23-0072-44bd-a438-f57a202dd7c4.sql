-- Ativar ou criar produto FL-14-TRAN-1 para permitir baixa de estoque
DO $$
DECLARE
  v_org_id uuid;
  v_produto_exists boolean := false;
BEGIN
  -- Buscar organização do usuário atual (assumindo que há uma organização ativa)
  SELECT organizacao_id INTO v_org_id 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
  
  -- Se não encontrou organização, usar a primeira disponível
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id 
    FROM public.organizacoes 
    ORDER BY created_at DESC 
    LIMIT 1;
  END IF;
  
  -- Verificar se produto já existe
  SELECT EXISTS(
    SELECT 1 FROM public.produtos 
    WHERE sku_interno = 'FL-14-TRAN-1' 
    AND organization_id = v_org_id
  ) INTO v_produto_exists;
  
  IF v_produto_exists THEN
    -- Produto existe, apenas ativar
    UPDATE public.produtos 
    SET ativo = true, 
        updated_at = now()
    WHERE sku_interno = 'FL-14-TRAN-1' 
    AND organization_id = v_org_id;
    
    RAISE NOTICE 'Produto FL-14-TRAN-1 ativado com sucesso!';
  ELSE
    -- Produto não existe, criar
    INSERT INTO public.produtos (
      organization_id,
      sku_interno,
      nome,
      categoria,
      preco_custo,
      preco_venda,
      quantidade_atual,
      estoque_minimo,
      estoque_maximo,
      unidade_medida,
      ativo,
      created_at,
      updated_at
    ) VALUES (
      v_org_id,
      'FL-14-TRAN-1',
      'Produto FL-14-TRAN-1',
      'Produtos Gerais',
      0.00,
      0.00,
      100, -- Quantidade inicial
      10,  -- Estoque mínimo
      1000, -- Estoque máximo
      'un',
      true,
      now(),
      now()
    );
    
    RAISE NOTICE 'Produto FL-14-TRAN-1 criado com sucesso!';
  END IF;
END $$;