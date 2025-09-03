-- Criar função para gerar hierarquia a partir dos produtos
CREATE OR REPLACE FUNCTION generate_category_hierarchy_from_products()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_produto record;
  v_parts text[];
  v_principal text;
  v_categoria text;
  v_subcategoria text;
  v_principal_id uuid;
  v_categoria_id uuid;
  v_created_count integer := 0;
  v_colors text[] := ARRAY['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899'];
  v_color_index integer := 0;
BEGIN
  -- Obter organização atual
  v_org_id := public.get_current_org_id();
  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organização não encontrada');
  END IF;

  -- Processar produtos com categorias hierárquicas
  FOR v_produto IN 
    SELECT DISTINCT categoria 
    FROM produtos 
    WHERE categoria IS NOT NULL 
      AND categoria != '' 
      AND categoria LIKE '%→%'
      AND organization_id = v_org_id
  LOOP
    -- Dividir categoria em partes
    v_parts := string_to_array(v_produto.categoria, '→');
    
    -- Limpar espaços
    FOR i IN 1..array_length(v_parts, 1) LOOP
      v_parts[i] := trim(v_parts[i]);
    END LOOP;
    
    IF array_length(v_parts, 1) >= 2 THEN
      v_principal := v_parts[1];
      v_categoria := v_parts[2];
      v_subcategoria := CASE WHEN array_length(v_parts, 1) >= 3 THEN v_parts[3] ELSE NULL END;
      
      -- Buscar ID da categoria principal
      SELECT id INTO v_principal_id 
      FROM categorias_produtos 
      WHERE nome = v_principal 
        AND nivel = 1 
        AND organization_id = v_org_id 
        AND ativo = true;
      
      IF v_principal_id IS NOT NULL THEN
        -- Criar categoria de nível 2 se não existir
        SELECT id INTO v_categoria_id
        FROM categorias_produtos
        WHERE nome = v_categoria
          AND nivel = 2
          AND categoria_principal_id = v_principal_id
          AND organization_id = v_org_id
          AND ativo = true;
        
        IF v_categoria_id IS NULL THEN
          INSERT INTO categorias_produtos (
            nome, nivel, categoria_principal_id, cor, ativo, organization_id
          ) VALUES (
            v_categoria, 2, v_principal_id, 
            v_colors[(v_color_index % array_length(v_colors, 1)) + 1], 
            true, v_org_id
          ) RETURNING id INTO v_categoria_id;
          
          v_created_count := v_created_count + 1;
          v_color_index := v_color_index + 1;
        END IF;
        
        -- Criar subcategoria se existir e não foi criada
        IF v_subcategoria IS NOT NULL AND v_categoria_id IS NOT NULL THEN
          IF NOT EXISTS (
            SELECT 1 FROM categorias_produtos 
            WHERE nome = v_subcategoria 
              AND nivel = 3 
              AND categoria_id = v_categoria_id 
              AND organization_id = v_org_id 
              AND ativo = true
          ) THEN
            INSERT INTO categorias_produtos (
              nome, nivel, categoria_principal_id, categoria_id, cor, ativo, organization_id
            ) VALUES (
              v_subcategoria, 3, v_principal_id, v_categoria_id,
              v_colors[(v_color_index % array_length(v_colors, 1)) + 1],
              true, v_org_id
            );
            
            v_created_count := v_created_count + 1;
            v_color_index := v_color_index + 1;
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true, 
    'created', v_created_count,
    'organization_id', v_org_id
  );
END;
$$;