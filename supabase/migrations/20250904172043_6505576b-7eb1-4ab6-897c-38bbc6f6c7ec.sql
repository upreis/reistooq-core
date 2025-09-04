-- Criar categorias e subcategorias para as categorias principais existentes
DO $$
DECLARE
  cat_id uuid;
  org_id uuid;
  sub_id uuid;
BEGIN
  -- Obter a organização atual (primeira organização encontrada)
  SELECT organization_id INTO org_id FROM categorias_produtos LIMIT 1;
  
  -- 1. ELETRÔNICOS
  SELECT id INTO cat_id FROM categorias_produtos WHERE nome = 'Eletrônicos, Áudio e Vídeo' AND nivel = 1 LIMIT 1;
  IF cat_id IS NOT NULL THEN
    -- Categorias nível 2
    INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, organization_id, ordem, ativo) VALUES
    ('Smartphones', 'Telefones celulares e smartphones', 2, cat_id, org_id, 1, true),
    ('Tablets', 'Tablets e iPads', 2, cat_id, org_id, 2, true),
    ('Notebooks e Computadores', 'Laptops, desktops e acessórios', 2, cat_id, org_id, 3, true),
    ('Áudio e Som', 'Fones de ouvido, caixas de som, microfones', 2, cat_id, org_id, 4, true);
    
    -- Subcategorias para Smartphones
    SELECT id INTO sub_id FROM categorias_produtos WHERE nome = 'Smartphones' AND categoria_principal_id = cat_id LIMIT 1;
    IF sub_id IS NOT NULL THEN
      INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, categoria_id, organization_id, ordem, ativo) VALUES
      ('iPhone', 'Smartphones Apple iPhone', 3, cat_id, sub_id, org_id, 1, true),
      ('Samsung Galaxy', 'Linha Samsung Galaxy', 3, cat_id, sub_id, org_id, 2, true),
      ('Xiaomi', 'Smartphones Xiaomi', 3, cat_id, sub_id, org_id, 3, true);
    END IF;
    
    -- Subcategorias para Notebooks
    SELECT id INTO sub_id FROM categorias_produtos WHERE nome = 'Notebooks e Computadores' AND categoria_principal_id = cat_id LIMIT 1;
    IF sub_id IS NOT NULL THEN
      INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, categoria_id, organization_id, ordem, ativo) VALUES
      ('Notebooks', 'Notebooks e laptops', 3, cat_id, sub_id, org_id, 1, true),
      ('Desktops', 'Computadores de mesa', 3, cat_id, sub_id, org_id, 2, true),
      ('Acessórios', 'Teclados, mouses, monitores', 3, cat_id, sub_id, org_id, 3, true);
    END IF;
  END IF;

  -- 2. ROUPAS
  SELECT id INTO cat_id FROM categorias_produtos WHERE nome = 'Calçados, Roupas e Bolsas' AND nivel = 1 LIMIT 1;
  IF cat_id IS NOT NULL THEN
    -- Categorias nível 2
    INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, organization_id, ordem, ativo) VALUES
    ('Roupas Masculinas', 'Vestuário masculino', 2, cat_id, org_id, 1, true),
    ('Roupas Femininas', 'Vestuário feminino', 2, cat_id, org_id, 2, true),
    ('Calçados', 'Sapatos, tênis, sandálias', 2, cat_id, org_id, 3, true),
    ('Bolsas e Acessórios', 'Bolsas, carteiras, cintos', 2, cat_id, org_id, 4, true);
    
    -- Subcategorias para Roupas Masculinas
    SELECT id INTO sub_id FROM categorias_produtos WHERE nome = 'Roupas Masculinas' AND categoria_principal_id = cat_id LIMIT 1;
    IF sub_id IS NOT NULL THEN
      INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, categoria_id, organization_id, ordem, ativo) VALUES
      ('Camisetas', 'Camisetas masculinas', 3, cat_id, sub_id, org_id, 1, true),
      ('Calças', 'Calças jeans, sociais, esportivas', 3, cat_id, sub_id, org_id, 2, true),
      ('Camisas', 'Camisas sociais e casuais', 3, cat_id, sub_id, org_id, 3, true);
    END IF;
  END IF;

  -- 3. CASA E DECORAÇÃO
  SELECT id INTO cat_id FROM categorias_produtos WHERE nome = 'Casa, Móveis e Decoração' AND nivel = 1 LIMIT 1;
  IF cat_id IS NOT NULL THEN
    -- Categorias nível 2
    INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, organization_id, ordem, ativo) VALUES
    ('Móveis', 'Móveis para casa', 2, cat_id, org_id, 1, true),
    ('Decoração', 'Objetos decorativos', 2, cat_id, org_id, 2, true),
    ('Cozinha e Mesa', 'Utensílios de cozinha e mesa', 2, cat_id, org_id, 3, true),
    ('Banheiro', 'Acessórios e produtos para banheiro', 2, cat_id, org_id, 4, true);
    
    -- Subcategorias para Móveis
    SELECT id INTO sub_id FROM categorias_produtos WHERE nome = 'Móveis' AND categoria_principal_id = cat_id LIMIT 1;
    IF sub_id IS NOT NULL THEN
      INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, categoria_id, organization_id, ordem, ativo) VALUES
      ('Sofás e Poltronas', 'Móveis estofados', 3, cat_id, sub_id, org_id, 1, true),
      ('Mesas e Cadeiras', 'Móveis para sala de jantar', 3, cat_id, sub_id, org_id, 2, true),
      ('Camas e Guarda-roupas', 'Móveis para quarto', 3, cat_id, sub_id, org_id, 3, true);
    END IF;
  END IF;

  -- 4. ESPORTES
  SELECT id INTO cat_id FROM categorias_produtos WHERE nome = 'Esportes e Fitness' AND nivel = 1 LIMIT 1;
  IF cat_id IS NOT NULL THEN
    -- Categorias nível 2
    INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, organization_id, ordem, ativo) VALUES
    ('Roupas Esportivas', 'Vestuário para esportes', 2, cat_id, org_id, 1, true),
    ('Equipamentos', 'Equipamentos esportivos', 2, cat_id, org_id, 2, true),
    ('Fitness', 'Produtos para academia e fitness', 2, cat_id, org_id, 3, true),
    ('Calçados Esportivos', 'Tênis e calçados esportivos', 2, cat_id, org_id, 4, true);
    
    -- Subcategorias para Equipamentos
    SELECT id INTO sub_id FROM categorias_produtos WHERE nome = 'Equipamentos' AND categoria_principal_id = cat_id LIMIT 1;
    IF sub_id IS NOT NULL THEN
      INSERT INTO categorias_produtos (nome, descricao, nivel, categoria_principal_id, categoria_id, organization_id, ordem, ativo) VALUES
      ('Futebol', 'Equipamentos de futebol', 3, cat_id, sub_id, org_id, 1, true),
      ('Natação', 'Equipamentos de natação', 3, cat_id, sub_id, org_id, 2, true),
      ('Musculação', 'Equipamentos de musculação', 3, cat_id, sub_id, org_id, 3, true);
    END IF;
  END IF;

  RAISE NOTICE 'Categorias hierárquicas criadas com sucesso!';
END $$;