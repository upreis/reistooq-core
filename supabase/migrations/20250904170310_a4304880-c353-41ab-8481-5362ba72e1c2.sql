-- Criar categorias hierárquicas para "Bebês" de forma segura
DO $$
DECLARE
  bebes_id uuid;
  org_id uuid;
  roupas_id uuid;
  alimentacao_id uuid;
  higiene_id uuid;
  brinquedos_id uuid;
BEGIN
  -- Buscar o ID da primeira categoria "Bebês" de nível 1
  SELECT id, organization_id INTO bebes_id, org_id 
  FROM categorias_produtos 
  WHERE nome = 'Bebês' AND nivel = 1 AND ativo = true 
  LIMIT 1;
  
  -- Verificar se encontrou a categoria
  IF bebes_id IS NULL THEN
    RAISE EXCEPTION 'Categoria Bebês não encontrada';
  END IF;
  
  -- Criar categorias de nível 2 para Bebês
  INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, organization_id, ordem, ativo)
  VALUES 
    ('Roupas e Acessórios', 'Roupinhas, sapatos e acessórios para bebês', 2, bebes_id, org_id, 1, true),
    ('Alimentação', 'Mamadeiras, papinhas e utensílios de alimentação', 2, bebes_id, org_id, 2, true),
    ('Higiene e Cuidados', 'Fraldas, produtos de banho e cuidados', 2, bebes_id, org_id, 3, true),
    ('Brinquedos', 'Brinquedos educativos e de desenvolvimento', 2, bebes_id, org_id, 4, true);
  
  -- Buscar os IDs das categorias recém criadas
  SELECT id INTO roupas_id FROM categorias_produtos WHERE nome = 'Roupas e Acessórios' AND categoria_principal_id = bebes_id LIMIT 1;
  SELECT id INTO alimentacao_id FROM categorias_produtos WHERE nome = 'Alimentação' AND categoria_principal_id = bebes_id LIMIT 1;
  SELECT id INTO higiene_id FROM categorias_produtos WHERE nome = 'Higiene e Cuidados' AND categoria_principal_id = bebes_id LIMIT 1;
  SELECT id INTO brinquedos_id FROM categorias_produtos WHERE nome = 'Brinquedos' AND categoria_principal_id = bebes_id LIMIT 1;
  
  -- Criar subcategorias de nível 3 para "Roupas e Acessórios"
  INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, categoria_id, organization_id, ordem, ativo)
  VALUES 
    ('Bodies e Macacões', 'Bodies, macacões e conjuntos', 3, bebes_id, roupas_id, org_id, 1, true),
    ('Sapatos e Meias', 'Calçados e meias para bebês', 3, bebes_id, roupas_id, org_id, 2, true),
    ('Acessórios', 'Toucas, babadores e outros acessórios', 3, bebes_id, roupas_id, org_id, 3, true);
  
  -- Criar subcategorias de nível 3 para "Alimentação"
  INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, categoria_id, organization_id, ordem, ativo)
  VALUES 
    ('Mamadeiras e Bicos', 'Mamadeiras, bicos e acessórios', 3, bebes_id, alimentacao_id, org_id, 1, true),
    ('Papinhas e Cereais', 'Alimentos prontos e cereais infantis', 3, bebes_id, alimentacao_id, org_id, 2, true),
    ('Utensílios', 'Pratos, copos e talheres infantis', 3, bebes_id, alimentacao_id, org_id, 3, true);
    
  -- Criar subcategorias de nível 3 para "Higiene e Cuidados"
  INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, categoria_id, organization_id, ordem, ativo)
  VALUES 
    ('Fraldas', 'Fraldas descartáveis e de pano', 3, bebes_id, higiene_id, org_id, 1, true),
    ('Banho', 'Sabonetes, shampoos e produtos de banho', 3, bebes_id, higiene_id, org_id, 2, true),
    ('Cuidados Especiais', 'Pomadas, óleos e cremes', 3, bebes_id, higiene_id, org_id, 3, true);
    
  RAISE NOTICE 'Categorias criadas com sucesso para a categoria Bebês';
END $$;