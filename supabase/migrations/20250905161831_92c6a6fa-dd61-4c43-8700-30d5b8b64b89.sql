-- Atualizar função seed_default_categories para incluir TODAS as subcategorias de nível 3
CREATE OR REPLACE FUNCTION public.seed_default_categories()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_created_l1 int := 0;
  v_created_l2 int := 0;
  v_created_l3 int := 0;
  principal_id uuid;
  category_id uuid;
BEGIN
  -- Inserir TODAS as 26 categorias principais (nível 1) se não existirem
  WITH l1(nome, ordem) AS (
    VALUES
      ('Acessórios para Veículos', 1),
      ('Agro', 2),
      ('Alimentos e Bebidas', 3),
      ('Animais', 4),
      ('Antiguidades e Coleções', 5),
      ('Arte, Papelaria e Armarinho', 6),
      ('Bebês', 7),
      ('Beleza e Cuidado Pessoal', 8),
      ('Brinquedos e Hobbies', 9),
      ('Calçados, Roupas e Bolsas', 10),
      ('Câmeras e Acessórios', 11),
      ('Casa, Móveis e Decoração', 12),
      ('Celulares e Telefones', 13),
      ('Construção', 14),
      ('Eletrodomésticos', 15),
      ('Eletrônicos, Áudio e Vídeo', 16),
      ('Esportes e Fitness', 17),
      ('Ferramentas', 18),
      ('Festas e Lembrancinhas', 19),
      ('Games', 20),
      ('Indústria e Comércio', 21),
      ('Informática', 22),
      ('Instrumentos Musicais', 23),
      ('Joias e Relógios', 24),
      ('Mais Categorias', 25),
      ('Saúde', 26)
  ), ins AS (
    INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_completa)
    SELECT 1, nome, ordem, true, nome
    FROM l1
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo c
      WHERE c.nivel = 1 AND c.nome = l1.nome
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_created_l1 FROM ins;

  -- A) ACESSÓRIOS PARA VEÍCULOS
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Acessórios para Veículos' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Acessórios para Veículos', 1, true, 'Acessórios para Veículos')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  -- Carros e Caminhonetes
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Carros e Caminhonetes' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Carros e Caminhonetes', 1, true, principal_id, 'Acessórios para Veículos > Carros e Caminhonetes')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Carros e Caminhonetes > ' || sub.nome
  FROM (VALUES 
    ('Acessórios para Interior', 1), ('Alarmes e Trava Elétricas', 2), ('Ar-condicionado Automotivo', 3),
    ('Baterias Automotivas', 4), ('Buzinas', 5), ('Câmbio', 6), ('Capas para Carros', 7),
    ('Cromados e Apliques', 8), ('Direção', 9), ('Distúrbios Elétricos', 10),
    ('Eletroventiladores', 11), ('Embreagem', 12), ('Escapamentos', 13), ('Espelhos', 14),
    ('Fechaduras e Chaves', 15), ('Filtros', 16), ('Freios', 17), ('GPS Automotivo', 18),
    ('Instrumentos', 19), ('Kits Automotivos', 20), ('Lanternas', 21), ('Limpadores de Para-brisa', 22),
    ('Luzes', 23), ('Motores', 24), ('Óleos e Fluidos', 25), ('Para-choques', 26),
    ('Para-lamas', 27), ('Peças de Carroceria', 28), ('Pneus e Rodas', 29), ('Radiadores', 30),
    ('Retrovisores', 31), ('Sistema de Arrefecimento', 32), ('Sistema de Ignição', 33), 
    ('Sistema Elétrico', 34), ('Som e Multimídia', 35), ('Suspensão', 36), ('Tapetes', 37),
    ('Turbo e Compressores', 38), ('Vidros', 39), ('Outros', 40)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);
  GET DIAGNOSTICS v_created_l3 = ROW_COUNT;

  -- Motos
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Motos' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Motos', 2, true, principal_id, 'Acessórios para Veículos > Motos')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Motos > ' || sub.nome
  FROM (VALUES 
    ('Acessórios', 1), ('Alarmes para Motos', 2), ('Capacetes', 3), ('Carburadores', 4),
    ('Carenagens', 5), ('Chassi e Suspensão', 6), ('Cilindros', 7), ('Escapamentos', 8),
    ('Espelhos', 9), ('Filtros', 10), ('Freios', 11), ('Guidões', 12),
    ('Instrumentos', 13), ('Kits', 14), ('Lanternas', 15), ('Motores', 16),
    ('Óleos e Fluidos', 17), ('Para-lamas', 18), ('Peças de Motor', 19), ('Pneus e Rodas', 20),
    ('Sistemas Elétricos', 21), ('Tanques de Combustível', 22), ('Transmissão', 23), ('Outros', 24)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- B) CASA, MÓVEIS E DECORAÇÃO (Expandindo com mais subcategorias)
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Casa, Móveis e Decoração' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Casa, Móveis e Decoração', 12, true, 'Casa, Móveis e Decoração')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  -- Decoração (expandida)
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Decoração' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Decoração', 1, true, principal_id, 'Casa, Móveis e Decoração > Decoração')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Casa, Móveis e Decoração > Decoração > ' || sub.nome
  FROM (VALUES 
    ('Almofadas', 1), ('Arranjos e Flores Artificiais', 2), ('Artigos Religiosos', 3), ('Cestas', 4),
    ('Cortinas e Persianas', 5), ('Espelhos', 6), ('Esculturas', 7), ('Estátuas', 8),
    ('Fontes Decorativas', 9), ('Incensos e Defumadores', 10), ('Objetos Decorativos', 11), 
    ('Pinturas', 12), ('Porta-retratos', 13), ('Quadros e Molduras', 14), ('Relógios de Parede', 15),
    ('Tapetes', 16), ('Vasos Decorativos', 17), ('Velas e Aromatizadores', 18), ('Outros', 19)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Móveis (expandida)
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Móveis' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Móveis', 2, true, principal_id, 'Casa, Móveis e Decoração > Móveis')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Casa, Móveis e Decoração > Móveis > ' || sub.nome
  FROM (VALUES 
    ('Bancos e Banquetas', 1), ('Camas', 2), ('Cadeiras', 3), ('Cômodas', 4),
    ('Escrivaninhas', 5), ('Estantes e Prateleiras', 6), ('Guarda-roupas', 7), ('Mesas', 8),
    ('Móveis para Banheiro', 9), ('Móveis para Cozinha', 10), ('Poltrona Relaxante', 11), 
    ('Poltronas e Sofás', 12), ('Racks e Estantes para TV', 13), ('Sapateiras', 14), ('Outros', 15)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Casa e Construção
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Casa e Construção' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Casa e Construção', 3, true, principal_id, 'Casa, Móveis e Decoração > Casa e Construção')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Casa, Móveis e Decoração > Casa e Construção > ' || sub.nome
  FROM (VALUES 
    ('Argamassas e Cimentos', 1), ('Banheiras e Acessórios', 2), ('Materiais de Construção', 3), 
    ('Pisos e Azulejos', 4), ('Portas e Janelas', 5), ('Telhas', 6), ('Tintas', 7),
    ('Tubulações', 8), ('Outros', 9)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- C) ELETRÔNICOS, ÁUDIO E VÍDEO (Expandindo significativamente)
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Eletrônicos, Áudio e Vídeo' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Eletrônicos, Áudio e Vídeo', 16, true, 'Eletrônicos, Áudio e Vídeo')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  -- Smartphones (expandida)
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Smartphones' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Smartphones', 1, true, principal_id, 'Eletrônicos, Áudio e Vídeo > Smartphones')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Eletrônicos, Áudio e Vídeo > Smartphones > ' || sub.nome
  FROM (VALUES 
    ('iPhone', 1), ('Samsung Galaxy', 2), ('Xiaomi', 3), ('Motorola', 4), ('LG', 5), ('OnePlus', 6),
    ('Huawei', 7), ('Google Pixel', 8), ('Nokia', 9), ('Sony Xperia', 10), ('Asus', 11), 
    ('Realme', 12), ('Oppo', 13), ('Vivo', 14), ('Honor', 15), ('Outros', 16)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Tablets
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Tablets' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Tablets', 2, true, principal_id, 'Eletrônicos, Áudio e Vídeo > Tablets')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Eletrônicos, Áudio e Vídeo > Tablets > ' || sub.nome
  FROM (VALUES 
    ('iPad', 1), ('Samsung Galaxy Tab', 2), ('Lenovo Tab', 3), ('Positivo', 4), ('Multilaser', 5),
    ('Xiaomi Pad', 6), ('Huawei MatePad', 7), ('Amazon Fire', 8), ('Microsoft Surface', 9), ('Outros', 10)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- TV e Home Theater
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'TV e Home Theater' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'TV e Home Theater', 3, true, principal_id, 'Eletrônicos, Áudio e Vídeo > TV e Home Theater')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Eletrônicos, Áudio e Vídeo > TV e Home Theater > ' || sub.nome
  FROM (VALUES 
    ('Smart TV', 1), ('TV LED', 2), ('TV OLED', 3), ('TV 4K', 4), ('Projetores', 5),
    ('Receivers', 6), ('Caixas de Som', 7), ('Soundbars', 8), ('Blu-ray Players', 9),
    ('Streaming Devices', 10), ('Controles Remotos', 11), ('Suportes para TV', 12), ('Outros', 13)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- D) INFORMÁTICA (Nova categoria completa)
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Informática' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Informática', 22, true, 'Informática')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  -- Notebooks
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Notebooks' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Notebooks', 1, true, principal_id, 'Informática > Notebooks')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Informática > Notebooks > ' || sub.nome
  FROM (VALUES 
    ('Dell', 1), ('HP', 2), ('Lenovo', 3), ('Asus', 4), ('Acer', 5), ('Apple MacBook', 6),
    ('Samsung', 7), ('MSI', 8), ('Positivo', 9), ('Vaio', 10), ('Avell', 11), ('Outros', 12)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Computadores Desktop
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Computadores Desktop' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Computadores Desktop', 2, true, principal_id, 'Informática > Computadores Desktop')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Informática > Computadores Desktop > ' || sub.nome
  FROM (VALUES 
    ('PCs Gamer', 1), ('All-in-One', 2), ('Workstations', 3), ('Mini PCs', 4), ('Outros', 5)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- E) CALÇADOS, ROUPAS E BOLSAS (Nova categoria completa)
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Calçados, Roupas e Bolsas' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Calçados, Roupas e Bolsas', 10, true, 'Calçados, Roupas e Bolsas')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  -- Roupas Femininas
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Roupas Femininas' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Roupas Femininas', 1, true, principal_id, 'Calçados, Roupas e Bolsas > Roupas Femininas')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Calçados, Roupas e Bolsas > Roupas Femininas > ' || sub.nome
  FROM (VALUES 
    ('Blusas', 1), ('Vestidos', 2), ('Saias', 3), ('Calças', 4), ('Shorts', 5),
    ('Jaquetas e Casacos', 6), ('Lingerie', 7), ('Moda Praia', 8), ('Roupas Íntimas', 9),
    ('Pijamas', 10), ('Roupas Esportivas', 11), ('Moda Gestante', 12), ('Outros', 13)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Roupas Masculinas
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Roupas Masculinas' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Roupas Masculinas', 2, true, principal_id, 'Calçados, Roupas e Bolsas > Roupas Masculinas')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Calçados, Roupas e Bolsas > Roupas Masculinas > ' || sub.nome
  FROM (VALUES 
    ('Camisas', 1), ('Camisetas', 2), ('Calças', 3), ('Bermudas', 4), ('Jaquetas e Casacos', 5),
    ('Ternos', 6), ('Cuecas', 7), ('Meias', 8), ('Pijamas', 9), ('Roupas Esportivas', 10), ('Outros', 11)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Calçados
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Calçados' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Calçados', 3, true, principal_id, 'Calçados, Roupas e Bolsas > Calçados')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Calçados, Roupas e Bolsas > Calçados > ' || sub.nome
  FROM (VALUES 
    ('Tênis', 1), ('Sapatos Sociais', 2), ('Sandálias', 3), ('Chinelos', 4), ('Botas', 5),
    ('Sapatilhas', 6), ('Scarpins', 7), ('Mocassins', 8), ('Chuteiras', 9), ('Outros', 10)
  ) AS sub(nome, ordem)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  RETURN json_build_object('success', true, 'created_level1', v_created_l1, 'created_level2', v_created_l2, 'created_level3', v_created_l3);
END;
$function$