-- Continuar inserindo as categorias restantes de Acessórios para Veículos com verificação
DO $$
DECLARE
  principal_id uuid;
  category_id uuid;
BEGIN
  SELECT id INTO principal_id FROM public.categorias_catalogo 
  WHERE nivel = 1 AND nome = 'Acessórios para Veículos' LIMIT 1;

  -- 9) Navegadores GPS para Vehículos (3 subcategorias) - com verificação
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Navegadores GPS para Vehículos';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Navegadores GPS para Vehículos > ' || s.nome
  FROM (VALUES 
    ('Acessórios', 1), ('Aparelhos GPS', 2), ('Mapas', 3)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c 
    WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 11) Performance (1 subcategoria)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Performance';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Performance > ' || s.nome
  FROM (VALUES 
    ('Motor', 1)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c 
    WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 12) Peças Náuticas (5 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Peças Náuticas';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Peças Náuticas > ' || s.nome
  FROM (VALUES 
    ('Controles e Condução', 1), ('Convés e Cabine', 2), ('Ferragens e Fixações', 3), 
    ('Motores e Peças', 4), ('Navegação à Vela', 5)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c 
    WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 13) Peças de Carros e Caminhonetes (10 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Peças de Carros e Caminhonetes';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > ' || s.nome
  FROM (VALUES 
    ('Carroceria', 1), ('Eletroventiladores', 2), ('Fechaduras e Chaves', 3), ('Filtros', 4),
    ('Freios', 5), ('Ignição', 6), ('Injeção', 7), ('Peças de Exterior', 8), 
    ('Peças de Interior', 9), ('Suspensão e Direção', 10)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c 
    WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 14) Peças de Motos e Quadriciclos (2 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Peças de Motos e Quadriciclos';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Motos e Quadriciclos > ' || s.nome
  FROM (VALUES 
    ('Chassis', 1), ('Escapamentos e Silenciosos', 2)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c 
    WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 15) Pneus e Acessórios (4 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Pneus e Acessórios';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Pneus e Acessórios > ' || s.nome
  FROM (VALUES 
    ('Câmaras de Ar', 1), ('Pneus de Carros e Caminhonetes', 2), 
    ('Pneus para Bicicletas', 3), ('Pneus para Motos', 4)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c 
    WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 16) Rodas (4 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Rodas';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Rodas > ' || s.nome
  FROM (VALUES 
    ('Adesivos de Remendo para Pneus', 1), ('Rodas de Carros e Caminhonetes', 2), 
    ('Rodas para Caminhoes', 3), ('Rodas para Quadriciclos', 4)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c 
    WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 17) Segurança Veicular (7 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Segurança Veicular';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Segurança Veicular > ' || s.nome
  FROM (VALUES 
    ('Alarmes e Acessórios', 1), ('Bafômetros', 2), ('Bate Rodas', 3), ('Extintores', 4), 
    ('Insulfilms', 5), ('Rastreadores para Veículos', 6), ('Triângulos de Segurança', 7)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c 
    WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 18) Som Automotivo (11 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Som Automotivo';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > ' || s.nome
  FROM (VALUES 
    ('Alto-Falantes', 1), ('Antenas', 2), ('Cabos e Conectores', 3), ('Caixas Acústicas', 4), 
    ('Controles Remotos', 5), ('Equalizadores', 6), ('Grades para Caixas de Som', 7), 
    ('Kits de Duas Vias', 8), ('Módulos Amplificadores', 9), ('Reprodutores', 10), ('Telas', 11)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c 
    WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 19) Tuning (4 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Tuning';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Tuning > ' || s.nome
  FROM (VALUES 
    ('Adesivos e Stickers', 1), ('Merchandising', 2), ('Tintas', 3), ('Tuning Interior', 4)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c 
    WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

END $$;