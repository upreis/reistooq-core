-- Corrigir estrutura L2/L3 para a categoria principal "Acessórios para Veículos"
-- Remove entradas divergentes e insere exatamente as fornecidas pelo usuário
DO $$
DECLARE
  principal_id uuid;
  category_id uuid;
BEGIN
  -- Garantir categoria principal (nível 1)
  SELECT id INTO principal_id FROM public.categorias_catalogo 
  WHERE nivel = 1 AND nome = 'Acessórios para Veículos' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Acessórios para Veículos', 1, true, 'Acessórios para Veículos')
    RETURNING id INTO principal_id;
  END IF;

  -- Definir a lista exata de categorias de nível 2 e suas ordens
  WITH l2(nome, ordem) AS (
    VALUES
      ('Aces. de Carros e Caminhonetes', 1),
      ('Aces. de Motos e Quadriciclos', 2),
      ('Acessórios Náuticos', 3),
      ('Acessórios de Linha Pesada', 4),
      ('Ferramentas para Veículos', 5),
      ('GNV', 6),
      ('Limpeza Automotiva', 7),
      ('Lubrificantes e Fluidos', 8),
      ('Navegadores GPS para Vehículos', 9),
      ('Outros', 10),
      ('Performance', 11),
      ('Peças Náuticas', 12),
      ('Peças de Carros e Caminhonetes', 13),
      ('Peças de Motos e Quadriciclos', 14),
      ('Pneus e Acessórios', 15),
      ('Rodas', 16),
      ('Segurança Veicular', 17),
      ('Som Automotivo', 18),
      ('Tuning', 19)
  )
  -- Excluir L3 atuais deste principal (para substituição precisa)
  DELETE FROM public.categorias_catalogo c3
  WHERE c3.nivel = 3 AND c3.categoria_principal_id = principal_id;

  -- Excluir L2 que não fazem parte da lista exata
  DELETE FROM public.categorias_catalogo c2
  WHERE c2.nivel = 2 
    AND c2.categoria_principal_id = principal_id
    AND c2.nome NOT IN (SELECT nome FROM l2);

  -- Inserir L2 que não existirem
  ;WITH l2_ins AS (
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    SELECT 2, l2.nome, l2.ordem, true, principal_id, 'Acessórios para Veículos > ' || l2.nome
    FROM l2
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo c
      WHERE c.nivel = 2 AND c.categoria_principal_id = principal_id AND c.nome = l2.nome
    )
    RETURNING id
  )
  SELECT 1; -- no-op para encerrar o WITH anterior

  -- Atualizar ordem, ativo e categoria_completa para L2 existentes
  UPDATE public.categorias_catalogo c
  SET ordem = l2.ordem,
      ativo = true,
      categoria_completa = 'Acessórios para Veículos > ' || l2.nome,
      updated_at = now()
  FROM (
    VALUES
      ('Aces. de Carros e Caminhonetes', 1),
      ('Aces. de Motos e Quadriciclos', 2),
      ('Acessórios Náuticos', 3),
      ('Acessórios de Linha Pesada', 4),
      ('Ferramentas para Veículos', 5),
      ('GNV', 6),
      ('Limpeza Automotiva', 7),
      ('Lubrificantes e Fluidos', 8),
      ('Navegadores GPS para Vehículos', 9),
      ('Outros', 10),
      ('Performance', 11),
      ('Peças Náuticas', 12),
      ('Peças de Carros e Caminhonetes', 13),
      ('Peças de Motos e Quadriciclos', 14),
      ('Pneus e Acessórios', 15),
      ('Rodas', 16),
      ('Segurança Veicular', 17),
      ('Som Automotivo', 18),
      ('Tuning', 19)
  ) AS l2(nome, ordem)
  WHERE c.nivel = 2 AND c.categoria_principal_id = principal_id AND c.nome = l2.nome;

  -- Helper: função local para obter id de L2 por nome
  -- Inserir L3 para cada L2

  -- 1) Aces. de Carros e Caminhonetes
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Aces. de Carros e Caminhonetes' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Carros e Caminhonetes > ' || s.nome
  FROM (VALUES 
    ('Exterior', 1), ('Interior', 2)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 2) Aces. de Motos e Quadriciclos
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Aces. de Motos e Quadriciclos' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos > ' || s.nome
  FROM (VALUES 
    ('Alarmes para Motos', 1), ('Alforges', 2), ('Capacetes', 3), ('Capas', 4),
    ('Indumentária e Calçado', 5), ('Intercomunicadores', 6), ('Outros', 7),
    ('Protetores de Motor', 8), ('Rampas', 9), ('Travas e Elásticos', 10)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 3) Acessórios Náuticos
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Acessórios Náuticos' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios Náuticos > ' || s.nome
  FROM (VALUES 
    ('Ancoragem e Amarração', 1), ('Bombas e Filtros de Água', 2), ('Iluminação', 3), ('Interior da Cabine', 4),
    ('Limpeza e Manutenção', 5), ('Proteção e Transporte', 6), ('Segurança e Salvamento', 7), ('Sistemas de Navegação', 8)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 4) Acessórios de Linha Pesada
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Acessórios de Linha Pesada' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios de Linha Pesada > ' || s.nome
  FROM (VALUES 
    ('Acessórios de Exterior', 1), ('Acessórios de Interior', 2)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 5) Ferramentas para Veículos
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Ferramentas para Veículos' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > ' || s.nome
  FROM (VALUES 
    ('Cabines de Pintura', 1), ('Chaves', 2), ('Elevação', 3), ('Esteiras para Mecânicos', 4),
    ('Extratores para Polia', 5), ('Ferramentas para Baterias', 6), ('Guinchos', 7), ('Infladores', 8),
    ('Medição', 9), ('Máquinas de Desmontar Pneus', 10), ('Outras', 11), ('Soquetes e Acessórios', 12)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 6) GNV
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'GNV' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > GNV > ' || s.nome
  FROM (VALUES ('Peças', 1)) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 7) Limpeza Automotiva
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Limpeza Automotiva' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > ' || s.nome
  FROM (VALUES 
    ('Abrilhantadores', 1), ('Anticorrosivos', 2), ('Aspiradores', 3), ('Boinas', 4), ('Ceras', 5),
    ('Desengraxantes', 6), ('Fragrâncias', 7), ('Limpa Radiadores', 8), ('Limpadores de Couro', 9),
    ('Lubrificantes', 10), ('Panos', 11), ('Polidor', 12), ('Removedores de Arranhões', 13),
    ('Shampoo para Carros', 14), ('Tratamentos', 15)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 8) Lubrificantes e Fluidos
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Lubrificantes e Fluidos' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Lubrificantes e Fluidos > ' || s.nome
  FROM (VALUES 
    ('Aditivos', 1), ('Agro e Indústria', 2), ('Carros e Caminhonetes', 3), ('Graxas', 4),
    ('Linha Pesada', 5), ('Líquidos', 6), ('Motos', 7), ('Náutica', 8)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 9) Navegadores GPS para Vehículos
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Navegadores GPS para Vehículos' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Navegadores GPS para Vehículos > ' || s.nome
  FROM (VALUES 
    ('Acessórios', 1), ('Aparelhos GPS', 2), ('Mapas', 3)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 10) Outros
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Outros' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Outros > ' || s.nome
  FROM (VALUES 
    ('Outros', 1)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 11) Performance
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Performance' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Performance > ' || s.nome
  FROM (VALUES ('Motor', 1)) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 12) Peças Náuticas
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Peças Náuticas' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Peças Náuticas > ' || s.nome
  FROM (VALUES 
    ('Controles e Condução', 1), ('Convés e Cabine', 2), ('Ferragens e Fixações', 3), ('Motores e Peças', 4),
    ('Navegação à Vela', 5)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 13) Peças de Carros e Caminhonetes
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Peças de Carros e Caminhonetes' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes > ' || s.nome
  FROM (VALUES 
    ('Carroceria', 1), ('Eletroventiladores', 2), ('Fechaduras e Chaves', 3), ('Filtros', 4),
    ('Freios', 5), ('Ignição', 6), ('Injeção', 7), ('Peças de Exterior', 8), ('Peças de Interior', 9),
    ('Suspensão e Direção', 10)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 14) Peças de Motos e Quadriciclos
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Peças de Motos e Quadriciclos' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Peças de Motos e Quadriciclos > ' || s.nome
  FROM (VALUES 
    ('Chassis', 1), ('Escapamentos e Silenciosos', 2)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 15) Pneus e Acessórios
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Pneus e Acessórios' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Pneus e Acessórios > ' || s.nome
  FROM (VALUES 
    ('Câmaras de Ar', 1), ('Pneus de Carros e Caminhonetes', 2), ('Pneus para Bicicletas', 3), ('Pneus para Motos', 4)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 16) Rodas
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Rodas' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Rodas > ' || s.nome
  FROM (VALUES 
    ('Adesivos de Remendo para Pneus', 1), ('Rodas de Carros e Caminhonetes', 2), ('Rodas para Caminhoes', 3), ('Rodas para Quadriciclos', 4)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 17) Segurança Veicular
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Segurança Veicular' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Segurança Veicular > ' || s.nome
  FROM (VALUES 
    ('Alarmes e Acessórios', 1), ('Bafômetros', 2), ('Bate Rodas', 3), ('Extintores', 4), ('Insulfilms', 5),
    ('Rastreadores para Veículos', 6), ('Triângulos de Segurança', 7)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 18) Som Automotivo
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Som Automotivo' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Som Automotivo > ' || s.nome
  FROM (VALUES 
    ('Alto-Falantes', 1), ('Antenas', 2), ('Cabos e Conectores', 3), ('Caixas Acústicas', 4), ('Controles Remotos', 5),
    ('Equalizadores', 6), ('Grades para Caixas de Som', 7), ('Kits de Duas Vias', 8), ('Módulos Amplificadores', 9),
    ('Reprodutores', 10), ('Telas', 11)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );

  -- 19) Tuning
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Tuning' LIMIT 1;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, s.nome, s.ordem, true, principal_id, category_id, 'Acessórios para Veículos > Tuning > ' || s.nome
  FROM (VALUES 
    ('Adesivos e Stickers', 1), ('Merchandising', 2), ('Tintas', 3), ('Tuning Interior', 4)
  ) AS s(nome, ordem)
  WHERE category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categorias_catalogo c WHERE c.nivel = 3 AND c.categoria_id = category_id AND c.nome = s.nome
  );
END $$;