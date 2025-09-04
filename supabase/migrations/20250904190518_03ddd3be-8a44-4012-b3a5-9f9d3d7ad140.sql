-- Create a SECURITY DEFINER function to seed default hierarchical categories for the current organization
-- This function bypasses RLS (runs as table owner) and respects the categoria hierarchy rules
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS json AS $$
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

  -- Helper: create/find principal
  -- Casa, Móveis e Decoração
  principal := 'Casa, Móveis e Decoração';
  SELECT id INTO principal_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 1 AND nome = principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 1)
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  -- Subcats for Casa
  PERFORM 1;
  -- Decoração
  cat := 'Decoração';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  FOREACH sub IN ARRAY ARRAY['Almofadas','Arranjos e Flores Artificiais','Cestas','Cortinas e Persianas'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.categorias_produtos 
      WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id
    ) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1);
      v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;
  -- Móveis
  cat := 'Móveis';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 2)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  FOREACH sub IN ARRAY ARRAY['Poltronas e Sofás','Mesas','Cadeiras','Estantes e Prateleiras'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.categorias_produtos 
      WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id
    ) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1);
      v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;
  -- Organização
  cat := 'Organização';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 3)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  FOREACH sub IN ARRAY ARRAY['Cabides','Caixas Organizadoras','Ganchos','Prateleiras'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.categorias_produtos 
      WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id
    ) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1);
      v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;
  -- Iluminação
  cat := 'Iluminação';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 4)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  FOREACH sub IN ARRAY ARRAY['Luminárias','Abajures','Lâmpadas','Lustres'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.categorias_produtos 
      WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id
    ) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1);
      v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;
  -- Jardim
  cat := 'Jardim';
  SELECT id INTO category_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 2 AND nome = cat AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 5)
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  FOREACH sub IN ARRAY ARRAY['Vasos','Plantas Artificiais','Ferramentas de Jardim','Sementes'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.categorias_produtos 
      WHERE organization_id = v_org AND nivel = 3 AND nome = sub AND categoria_id = category_id
    ) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1);
      v_created_l3 := v_created_l3 + 1;
    END IF;
  END LOOP;

  -- Eletrônicos, Áudio e Vídeo
  principal := 'Eletrônicos, Áudio e Vídeo';
  SELECT id INTO principal_id FROM public.categorias_produtos 
    WHERE organization_id = v_org AND nivel = 1 AND nome = principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 2)
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  -- Cats
  PERFORM 1;
  -- Smartphones
  cat := 'Smartphones';
  SELECT id INTO category_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=2 AND nome=cat AND categoria_principal_id=principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1) RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  FOREACH sub IN ARRAY ARRAY['iPhone','Samsung Galaxy','Xiaomi','Motorola'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=3 AND nome=sub AND categoria_id=category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1; END IF; END LOOP;
  -- Tablets
  cat := 'Tablets';
  SELECT id INTO category_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=2 AND nome=cat AND categoria_principal_id=principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 2) RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1; END IF;
  FOREACH sub IN ARRAY ARRAY['iPad','Samsung Tab','Lenovo Tab','Positivo'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=3 AND nome=sub AND categoria_id=category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1; END IF; END LOOP;
  -- Notebooks
  cat := 'Notebooks';
  SELECT id INTO category_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=2 AND nome=cat AND categoria_principal_id=principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 3) RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1; END IF;
  FOREACH sub IN ARRAY ARRAY['Dell','HP','Lenovo','Asus'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=3 AND nome=sub AND categoria_id=category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1; END IF; END LOOP;
  -- Áudio
  cat := 'Áudio';
  SELECT id INTO category_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=2 AND nome=cat AND categoria_principal_id=principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 4) RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1; END IF;
  FOREACH sub IN ARRAY ARRAY['Fones de Ouvido','Caixas de Som','Microfones','Amplificadores'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=3 AND nome=sub AND categoria_id=category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1; END IF; END LOOP;

  -- Beleza e Cuidado Pessoal
  principal := 'Beleza e Cuidado Pessoal';
  SELECT id INTO principal_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=1 AND nome=principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 3) RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1; END IF;
  -- Barbearia
  cat := 'Barbearia';
  SELECT id INTO category_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=2 AND nome=cat AND categoria_principal_id=principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1) RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1; END IF;
  FOREACH sub IN ARRAY ARRAY['Navalhas de Barbear','Pentes Alisadores de Barbas','Pincéis de Barba','Produtos Pós Barba'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=3 AND nome=sub AND categoria_id=category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1; END IF; END LOOP;
  -- Cuidados com a Pele
  cat := 'Cuidados com a Pele';
  SELECT id INTO category_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=2 AND nome=cat AND categoria_principal_id=principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 2) RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1; END IF;
  FOREACH sub IN ARRAY ARRAY['Autobronzeador','Cuidado Facial','Cuidado do Corpo','Proteção Solar'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=3 AND nome=sub AND categoria_id=category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1; END IF; END LOOP;

  -- Bebês
  principal := 'Bebês';
  SELECT id INTO principal_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=1 AND nome=principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 4) RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1; END IF;
  -- Higiene e Cuidados com o Bebê
  cat := 'Higiene e Cuidados com o Bebê';
  SELECT id INTO category_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=2 AND nome=cat AND categoria_principal_id=principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1) RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1; END IF;
  FOREACH sub IN ARRAY ARRAY['Escovas e Pentes','Esponjas de Banho','Fraldas','Kits Cuidados para Bebês'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=3 AND nome=sub AND categoria_id=category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1; END IF; END LOOP;

  -- Arte, Papelaria e Armarinho
  principal := 'Arte, Papelaria e Armarinho';
  SELECT id INTO principal_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=1 AND nome=principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 5) RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1; END IF;
  cat := 'Artigos de Armarinho';
  SELECT id INTO category_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=2 AND nome=cat AND categoria_principal_id=principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1) RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1; END IF;
  FOREACH sub IN ARRAY ARRAY['Flores de Tecido','Franjas','Lantejuelas','Lãs'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=3 AND nome=sub AND categoria_id=category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1; END IF; END LOOP;

  -- Animais
  principal := 'Animais';
  SELECT id INTO principal_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=1 AND nome=principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 6) RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1; END IF;
  cat := 'Cães';
  SELECT id INTO category_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=2 AND nome=cat AND categoria_principal_id=principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1) RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1; END IF;
  FOREACH sub IN ARRAY ARRAY['Adestramento','Alimento, Petisco e Suplemento','Cadeiras de Rocha','Camas e Casas'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=3 AND nome=sub AND categoria_id=category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1; END IF; END LOOP;

  -- Alimentos e Bebidas
  principal := 'Alimentos e Bebidas';
  SELECT id INTO principal_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=1 AND nome=principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 7) RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1; END IF;
  cat := 'Bebidas';
  SELECT id INTO category_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=2 AND nome=cat AND categoria_principal_id=principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1) RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1; END IF;
  FOREACH sub IN ARRAY ARRAY['Bebidas Alcoólicas Mistas','Bebidas Aperitivas','Bebidas Brancas e Licores','Cervejas'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=3 AND nome=sub AND categoria_id=category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1; END IF; END LOOP;

  -- Acessórios para Veículos
  principal := 'Acessórios para Veículos';
  SELECT id INTO principal_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=1 AND nome=principal LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, ativo, ordem)
    VALUES (v_org, principal, 1, true, 8) RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1; END IF;
  cat := 'Peças de Carros e Caminhonetes';
  SELECT id INTO category_id FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=2 AND nome=cat AND categoria_principal_id=principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_principal_id, ativo, ordem)
    VALUES (v_org, cat, 2, principal_id, true, 1) RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1; END IF;
  FOREACH sub IN ARRAY ARRAY['Eletroventiladores','Fechaduras e Chaves','Filtros','Freios'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.categorias_produtos WHERE organization_id=v_org AND nivel=3 AND nome=sub AND categoria_id=category_id) THEN
      INSERT INTO public.categorias_produtos(organization_id, nome, nivel, categoria_id, ativo, ordem)
      VALUES (v_org, sub, 3, category_id, true, 1); v_created_l3 := v_created_l3 + 1; END IF; END LOOP;

  RETURN json_build_object('success', true, 'created_level1', v_created_l1, 'created_level2', v_created_l2, 'created_level3', v_created_l3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;