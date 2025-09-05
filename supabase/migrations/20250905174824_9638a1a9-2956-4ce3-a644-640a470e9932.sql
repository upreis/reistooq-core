-- AGRO: ensure exact 13 L2 and their L3 exist (idempotent)
DO $$
DECLARE
  principal_id uuid;
  category_id uuid;
BEGIN
  -- Get or create L1 'Agro'
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Agro' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Agro', 2, true, 'Agro')
    RETURNING id INTO principal_id;
  END IF;

  -- 1) Agricultura de Precisão
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Agricultura de Precisão' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Agricultura de Precisão', 1, true, principal_id, 'Agro > Agricultura de Precisão')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Agricultura de Precisão > ' || v.nome
  FROM (VALUES ('Bandarilheiros por Satélite', 1)) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 2) Apicultura
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Apicultura' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Apicultura', 2, true, principal_id, 'Agro > Apicultura')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Apicultura > ' || v.nome
  FROM (VALUES ('Colmeias', 1), ('Extração do Mel', 2)) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 3) Armezenamento
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Armezenamento' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Armezenamento', 3, true, principal_id, 'Agro > Armezenamento')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Armezenamento > ' || v.nome
  FROM (VALUES ('Arejadores', 1), ('Sacos para Silagem', 2), ('Silos', 3)) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 4) Energia Renovável
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Energia Renovável' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Energia Renovável', 4, true, principal_id, 'Agro > Energia Renovável')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Energia Renovável > ' || v.nome
  FROM (VALUES ('Painéis Solares', 1)) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 5) Ferramentas de Trabalho
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Ferramentas de Trabalho' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Ferramentas de Trabalho', 5, true, principal_id, 'Agro > Ferramentas de Trabalho')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Ferramentas de Trabalho > ' || v.nome
  FROM (
    VALUES 
      ('Artigos para Equitação', 1),
      ('Ferramentas Elétricas', 2),
      ('Ferramentas Manuais', 3),
      ('Instrumentos de Medição', 4)
  ) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 6) Infra-estrutura Rural
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Infra-estrutura Rural' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Infra-estrutura Rural', 6, true, principal_id, 'Agro > Infra-estrutura Rural')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Infra-estrutura Rural > ' || v.nome
  FROM (
    VALUES 
      ('Bebedouros', 1),
      ('Bombas', 2),
      ('Carretas Agrícolas', 3),
      ('Cercas e Acessórios', 4),
      ('Equipamentos a Explosão', 5),
      ('Projetos de Carretinhas', 6),
      ('Tanques', 7)
  ) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 7) Insumos Agrícolas
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Insumos Agrícolas' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Insumos Agrícolas', 7, true, principal_id, 'Agro > Insumos Agrícolas')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Insumos Agrícolas > ' || v.nome
  FROM (
    VALUES 
      ('Fertilizantes', 1),
      ('Hidroponia', 2),
      ('Inseticidas e Herbicidas', 3)
  ) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 8) Insumos Gadeiros
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Insumos Gadeiros' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Insumos Gadeiros', 8, true, principal_id, 'Agro > Insumos Gadeiros')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Insumos Gadeiros > ' || v.nome
  FROM (
    VALUES 
      ('Alimentação e Suplementos', 1),
      ('Comedouros', 2)
  ) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 9) Irrigação
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Irrigação' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Irrigação', 9, true, principal_id, 'Agro > Irrigação')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Irrigação > ' || v.nome
  FROM (VALUES ('Irrigação por Asoersão', 1)) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 10) Maquinaria Agrícola
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Maquinaria Agrícola' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Maquinaria Agrícola', 10, true, principal_id, 'Agro > Maquinaria Agrícola')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Maquinaria Agrícola > ' || v.nome
  FROM (
    VALUES 
      ('Aradoras', 1),
      ('Dosadoras de Pó e Grão', 2),
      ('Ensacadoras de Silagens', 3),
      ('Moinhos de Pulverização', 4),
      ('Máquinas de Beneficiar', 5),
      ('Plantadeiras Manuais', 6),
      ('Prensas Enfardadeiras', 7),
      ('Pulverizadoras', 8),
      ('Semeadeiras', 9),
      ('Torradores de Café', 10),
      ('Tratores Cortadores de Grama', 11),
      ('Trituradores de Grãos', 12)
  ) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 11) Máquinas Forrageiras
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Máquinas Forrageiras' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Máquinas Forrageiras', 11, true, principal_id, 'Agro > Máquinas Forrageiras')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Máquinas Forrageiras > ' || v.nome
  FROM (VALUES ('Picadoras de Forragem', 1)) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 12) Produçao Animal
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Produçao Animal' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Produçao Animal', 12, true, principal_id, 'Agro > Produçao Animal')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Produçao Animal > ' || v.nome
  FROM (
    VALUES 
      ('Ferramentas e Acessórios', 1),
      ('Insumos para Nutrição Animal', 2),
      ('Leiteira', 3)
  ) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );

  -- 13) Proteção de Culturas
  SELECT id INTO category_id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Proteção de Culturas' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Proteção de Culturas', 13, true, principal_id, 'Agro > Proteção de Culturas')
    RETURNING id INTO category_id;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, v.nome, v.ordem, true, principal_id, category_id, 'Agro > Proteção de Culturas > ' || v.nome
  FROM (VALUES ('Fungicidas', 1)) AS v(nome, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c3 
    WHERE c3.nivel = 3 AND c3.nome = v.nome AND c3.categoria_id = category_id
  );
END$$;