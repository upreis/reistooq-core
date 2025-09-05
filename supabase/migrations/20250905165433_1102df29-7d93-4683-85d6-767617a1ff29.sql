-- Continuar inserindo as categorias restantes de Acessórios para Veículos
DO $$
DECLARE
  principal_id uuid;
  category_id uuid;
BEGIN
  SELECT id INTO principal_id FROM public.categorias_catalogo 
  WHERE nivel = 1 AND nome = 'Acessórios para Veículos' LIMIT 1;

  -- 9) Navegadores GPS para Vehículos (3 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Navegadores GPS para Vehículos';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Acessórios', 1, true, principal_id, category_id, 'Acessórios para Veículos > Navegadores GPS para Vehículos > Acessórios'),
    (3, 'Aparelhos GPS', 2, true, principal_id, category_id, 'Acessórios para Veículos > Navegadores GPS para Vehículos > Aparelhos GPS'),
    (3, 'Mapas', 3, true, principal_id, category_id, 'Acessórios para Veículos > Navegadores GPS para Vehículos > Mapas');

  -- 10) Outros (vazio pelo que vi na tabela - inserindo apenas para manter estrutura)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Outros';
  -- Sem subcategorias baseado na tabela

  -- 11) Performance (1 subcategoria)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Performance';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Motor', 1, true, principal_id, category_id, 'Acessórios para Veículos > Performance > Motor');

  -- 12) Peças Náuticas (5 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Peças Náuticas';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Controles e Condução', 1, true, principal_id, category_id, 'Acessórios para Veículos > Peças Náuticas > Controles e Condução'),
    (3, 'Convés e Cabine', 2, true, principal_id, category_id, 'Acessórios para Veículos > Peças Náuticas > Convés e Cabine'),
    (3, 'Ferragens e Fixações', 3, true, principal_id, category_id, 'Acessórios para Veículos > Peças Náuticas > Ferragens e Fixações'),
    (3, 'Motores e Peças', 4, true, principal_id, category_id, 'Acessórios para Veículos > Peças Náuticas > Motores e Peças'),
    (3, 'Navegação à Vela', 5, true, principal_id, category_id, 'Acessórios para Veículos > Peças Náuticas > Navegação à Vela');

  -- 13) Peças de Carros e Caminhonetes (10 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Peças de Carros e Caminhonetes';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Carroceria', 1, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Carroceria'),
    (3, 'Eletroventiladores', 2, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Eletroventiladores'),
    (3, 'Fechaduras e Chaves', 3, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Fechaduras e Chaves'),
    (3, 'Filtros', 4, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Filtros'),
    (3, 'Freios', 5, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Freios'),
    (3, 'Ignição', 6, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Ignição'),
    (3, 'Injeção', 7, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Injeção'),
    (3, 'Peças de Exterior', 8, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Peças de Exterior'),
    (3, 'Peças de Interior', 9, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Peças de Interior'),
    (3, 'Suspensão e Direção', 10, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Suspensão e Direção');

  -- 14) Peças de Motos e Quadriciclos (2 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Peças de Motos e Quadriciclos';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Chassis', 1, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Motos e Quadriciclos > Chassis'),
    (3, 'Escapamentos e Silenciosos', 2, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Motos e Quadriciclos > Escapamentos e Silenciosos');

  -- 15) Pneus e Acessórios (4 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Pneus e Acessórios';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Câmaras de Ar', 1, true, principal_id, category_id, 'Acessórios para Veículos > Pneus e Acessórios > Câmaras de Ar'),
    (3, 'Pneus de Carros e Caminhonetes', 2, true, principal_id, category_id, 'Acessórios para Veículos > Pneus e Acessórios > Pneus de Carros e Caminhonetes'),
    (3, 'Pneus para Bicicletas', 3, true, principal_id, category_id, 'Acessórios para Veículos > Pneus e Acessórios > Pneus para Bicicletas'),
    (3, 'Pneus para Motos', 4, true, principal_id, category_id, 'Acessórios para Veículos > Pneus e Acessórios > Pneus para Motos');

  -- 16) Rodas (4 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Rodas';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Adesivos de Remendo para Pneus', 1, true, principal_id, category_id, 'Acessórios para Veículos > Rodas > Adesivos de Remendo para Pneus'),
    (3, 'Rodas de Carros e Caminhonetes', 2, true, principal_id, category_id, 'Acessórios para Veículos > Rodas > Rodas de Carros e Caminhonetes'),
    (3, 'Rodas para Caminhoes', 3, true, principal_id, category_id, 'Acessórios para Veículos > Rodas > Rodas para Caminhoes'),
    (3, 'Rodas para Quadriciclos', 4, true, principal_id, category_id, 'Acessórios para Veículos > Rodas > Rodas para Quadriciclos');

  -- 17) Segurança Veicular (7 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Segurança Veicular';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Alarmes e Acessórios', 1, true, principal_id, category_id, 'Acessórios para Veículos > Segurança Veicular > Alarmes e Acessórios'),
    (3, 'Bafômetros', 2, true, principal_id, category_id, 'Acessórios para Veículos > Segurança Veicular > Bafômetros'),
    (3, 'Bate Rodas', 3, true, principal_id, category_id, 'Acessórios para Veículos > Segurança Veicular > Bate Rodas'),
    (3, 'Extintores', 4, true, principal_id, category_id, 'Acessórios para Veículos > Segurança Veicular > Extintores'),
    (3, 'Insulfilms', 5, true, principal_id, category_id, 'Acessórios para Veículos > Segurança Veicular > Insulfilms'),
    (3, 'Rastreadores para Veículos', 6, true, principal_id, category_id, 'Acessórios para Veículos > Segurança Veicular > Rastreadores para Veículos'),
    (3, 'Triângulos de Segurança', 7, true, principal_id, category_id, 'Acessórios para Veículos > Segurança Veicular > Triângulos de Segurança');

  -- 18) Som Automotivo (11 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Som Automotivo';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Alto-Falantes', 1, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > Alto-Falantes'),
    (3, 'Antenas', 2, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > Antenas'),
    (3, 'Cabos e Conectores', 3, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > Cabos e Conectores'),
    (3, 'Caixas Acústicas', 4, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > Caixas Acústicas'),
    (3, 'Controles Remotos', 5, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > Controles Remotos'),
    (3, 'Equalizadores', 6, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > Equalizadores'),
    (3, 'Grades para Caixas de Som', 7, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > Grades para Caixas de Som'),
    (3, 'Kits de Duas Vias', 8, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > Kits de Duas Vias'),
    (3, 'Módulos Amplificadores', 9, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > Módulos Amplificadores'),
    (3, 'Reprodutores', 10, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > Reprodutores'),
    (3, 'Telas', 11, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > Telas');

  -- 19) Tuning (4 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Tuning';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Adesivos e Stickers', 1, true, principal_id, category_id, 'Acessórios para Veículos > Tuning > Adesivos e Stickers'),
    (3, 'Merchandising', 2, true, principal_id, category_id, 'Acessórios para Veículos > Tuning > Merchandising'),
    (3, 'Tintas', 3, true, principal_id, category_id, 'Acessórios para Veículos > Tuning > Tintas'),
    (3, 'Tuning Interior', 4, true, principal_id, category_id, 'Acessórios para Veículos > Tuning > Tuning Interior');

END $$;