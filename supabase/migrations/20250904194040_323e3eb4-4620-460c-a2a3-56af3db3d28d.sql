-- Remover função existente e criar nova versão completa com todas as categorias das planilhas
DROP FUNCTION IF EXISTS public.seed_default_categories();

-- Criar função completa com todas as categorias das planilhas
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org uuid;
  v_created_l1 int := 0;
  v_created_l2 int := 0;
  v_created_l3 int := 0;
  principal text;
  cat text;
  sub text;
  principal_id uuid;
  category_id uuid;
BEGIN
  v_org := public.get_current_org_id();
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Organização não encontrada para o usuário atual';
  END IF;

  -- 1. ACESSÓRIOS PARA VEÍCULOS
  principal := 'Acessórios para Veículos';
  SELECT id INTO principal_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 1 AND nome = principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 1)
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  -- Carros e Caminhonetes
  cat := 'Carros e Caminhonetes';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Acessórios para Interior', 'Eletroventiladores', 'Fechaduras e Chaves', 'Filtros', 'Freios', 'Lanternas', 'Motores', 'Pneus e Rodas', 'Sistema de Arrefecimento', 'Som e Multimídia'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Motos
  cat := 'Motos';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 2)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Capacetes', 'Escapamentos', 'Filtros', 'Pneus e Rodas', 'Sistemas Elétricos'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- 2. ALIMENTOS E BEBIDAS
  principal := 'Alimentos e Bebidas';
  SELECT id INTO principal_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 1 AND nome = principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 2)
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;

  -- Bebidas
  cat := 'Bebidas';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Bebidas Alcoólicas Mistas', 'Bebidas Aperitivas', 'Bebidas Brancas e Licores', 'Cervejas', 'Energéticos', 'Refrigerantes', 'Sucos', 'Vinhos'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Comida e Bebida
  cat := 'Comida e Bebida';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 2)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Chocolate e Balas', 'Conservas', 'Farinhas, Grãos e Cereais', 'Temperos e Condimentos'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- 3. ANIMAIS
  principal := 'Animais';
  SELECT id INTO principal_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 1 AND nome = principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 3)
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;

  -- Aves e Acessórios
  cat := 'Aves e Acessórios';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Alimento para Aves', 'Gaiolas e Acessórios', 'Brinquedos para Aves'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Cães
  cat := 'Cães';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 2)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Adestramento', 'Alimento, Petisco e Suplemento', 'Cadeiras de Rocha', 'Camas e Casas', 'Coleiras e Guias', 'Higiene e Cuidados', 'Brinquedos'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Gatos
  cat := 'Gatos';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 3)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Alimento e Petisco', 'Areia Sanitária', 'Brinquedos', 'Camas e Casinhas', 'Higiene e Cuidados'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Peixes
  cat := 'Peixes';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 4)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Aquários e Decoração', 'Alimento para Peixes', 'Filtros e Bombas', 'Iluminação'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- 4. ARTE, PAPELARIA E ARMARINHO
  principal := 'Arte, Papelaria e Armarinho';
  SELECT id INTO principal_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 1 AND nome = principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 4)
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;

  -- Arte e Trabalhos Manuais
  cat := 'Arte e Trabalhos Manuais';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Desenho e Pintura', 'Massinha e Argila', 'Papel e Cartolina', 'Pincéis e Tintas'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Artigos de Armarinho
  cat := 'Artigos de Armarinho';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 2)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Aviamentos', 'Flores de Tecido', 'Franjas', 'Lantejuelas', 'Lãs', 'Linhas e Fios', 'Tecidos'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Materiais Escolares
  cat := 'Materiais Escolares';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 3)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Cadernos e Blocos', 'Canetas e Lápis', 'Cola e Fita Adesiva', 'Mochilas e Estojos', 'Réguas e Esquadros'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- 5. BEBÊS
  principal := 'Bebês';
  SELECT id INTO principal_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 1 AND nome = principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 5)
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;

  -- Alimentação e Amamentação
  cat := 'Alimentação e Amamentação';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Mamadeiras e Chupetas', 'Papinhas e Leites', 'Esterilizadores', 'Babadores'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Brinquedos para Bebês
  cat := 'Brinquedos para Bebês';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 2)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Mordedores', 'Móbiles', 'Pelúcias', 'Sonajeros'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Higiene e Cuidados com o Bebê
  cat := 'Higiene e Cuidados com o Bebê';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 3)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Escovas e Pentes', 'Esponjas de Banho', 'Fraldas', 'Kits Cuidados para Bebês', 'Lenços Umedecidos', 'Sabonetes e Shampoos'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Quarto do Bebê
  cat := 'Quarto do Bebê';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 4)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Berços e Cercados', 'Enxoval e Roupas de Cama', 'Decoração', 'Umidificadores'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- 6. BELEZA E CUIDADO PESSOAL
  principal := 'Beleza e Cuidado Pessoal';
  SELECT id INTO principal_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 1 AND nome = principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 6)
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;

  -- Barbearia
  cat := 'Barbearia';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Navalhas de Barbear', 'Pentes Alisadores de Barbas', 'Pincéis de Barba', 'Produtos Pós Barba'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Cuidados com a Pele
  cat := 'Cuidados com a Pele';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 2)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Autobronzeador', 'Cuidado Facial', 'Cuidado do Corpo', 'Proteção Solar'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- 7. CASA, MÓVEIS E DECORAÇÃO
  principal := 'Casa, Móveis e Decoração';
  SELECT id INTO principal_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 1 AND nome = principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 7)
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;

  -- Decoração
  cat := 'Decoração';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Almofadas', 'Arranjos e Flores Artificiais', 'Cestas', 'Cortinas e Persianas', 'Espelhos', 'Quadros e Molduras', 'Velas e Aromatizadores'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Iluminação
  cat := 'Iluminação';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 2)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Abajures', 'Lâmpadas', 'Luminárias', 'Lustres'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Jardim
  cat := 'Jardim';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 3)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Vasos', 'Plantas Artificiais', 'Ferramentas de Jardim', 'Sementes', 'Adubos', 'Regadores'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Móveis
  cat := 'Móveis';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 4)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Cadeiras', 'Estantes e Prateleiras', 'Mesas', 'Poltronas e Sofás', 'Racks e Estantes para TV'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Organização
  cat := 'Organização';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 5)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Cabides', 'Caixas Organizadoras', 'Ganchos', 'Prateleiras', 'Cestas e Organizadores'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- 8. ELETRÔNICOS, ÁUDIO E VÍDEO
  principal := 'Eletrônicos, Áudio e Vídeo';
  SELECT id INTO principal_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 1 AND nome = principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 8)
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;

  -- Áudio
  cat := 'Áudio';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Fones de Ouvido', 'Caixas de Som', 'Microfones', 'Amplificadores', 'Equipamentos de DJ'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Notebooks
  cat := 'Notebooks';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 2)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['Asus', 'Dell', 'HP', 'Lenovo', 'Acer', 'Apple'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Smartphones
  cat := 'Smartphones';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 3)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['iPhone', 'Samsung Galaxy', 'Xiaomi', 'Motorola', 'LG', 'OnePlus'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Tablets
  cat := 'Tablets';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 4)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  
  FOREACH sub IN ARRAY ARRAY['iPad', 'Samsung Tab', 'Lenovo Tab', 'Positivo', 'Multilaser'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'created_level1', v_created_l1, 'created_level2', v_created_l2, 'created_level3', v_created_l3);
END;
$$;