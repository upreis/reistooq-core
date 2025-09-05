-- Seed missing level-3 subcategories for AGRO
DO $$
DECLARE
  principal_id uuid;
  category_id uuid;
BEGIN
  -- Find AGRO principal category (nível 1)
  SELECT id INTO principal_id
  FROM public.categorias_catalogo
  WHERE nivel = 1 AND nome = 'Agro'
  LIMIT 1;

  IF principal_id IS NULL THEN
    RAISE NOTICE 'Categoria principal Agro não encontrada. Abortando seed.';
    RETURN;
  END IF;

  -- Helper to insert N3 items for a given L2 name
  -- For each L2 below: resolve the category_id then insert N3 if not exists

  -- Agricultura de Precisão
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Agricultura de Precisão' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Agricultura de Precisão > ' || sub.nome
    FROM (VALUES
      ('GPS e Guiamento', 1),
      ('Monitores de Plantio', 2),
      ('Controladores de Taxa Variável', 3),
      ('Drones Agrícolas', 4),
      ('Sensores de Solo', 5),
      ('Mapeamento e Software', 6),
      ('Piloto Automático', 7),
      ('Estações Meteorológicas', 8),
      ('Telemetria', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Animais
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Animais' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Animais > ' || sub.nome
    FROM (VALUES
      ('Bovinos', 1),
      ('Suínos', 2),
      ('Aves', 3),
      ('Equinos', 4),
      ('Ovinos e Caprinos', 5),
      ('Peixes e Aquicultura', 6),
      ('Coelhos', 7),
      ('Pets da Fazenda', 8),
      ('Rações e Alimentos', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Apicultura
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Apicultura' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Apicultura > ' || sub.nome
    FROM (VALUES
      ('Colmeias e Núcleos', 1),
      ('Fumigadores e Defumadores', 2),
      ('Roupas e EPIs Apícolas', 3),
      ('Alimentadores', 4),
      ('Ferramentas Apícolas', 5),
      ('Tratamentos e Sanidade', 6),
      ('Cera e Cera Laminada', 7),
      ('Coleta e Extração de Mel', 8),
      ('Armazenamento de Mel', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Armazenamento (cadastrado com possível typo "Armezenamento")
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome IN ('Armazenamento','Armezenamento') AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Armazenamento > ' || sub.nome
    FROM (VALUES
      ('Silos e Armazenagem de Grãos', 1),
      ('Sacarias e Big Bags', 2),
      ('Contentores e Caixas', 3),
      ('Paletes e Estrados', 4),
      ('Secadores e Aeradores', 5),
      ('Transportadores e Roscas', 6),
      ('Organização e Estocagem', 7),
      ('Refrigeração', 8),
      ('Embalagens', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Defensivos
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Defensivos' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Defensivos > ' || sub.nome
    FROM (VALUES
      ('Herbicidas', 1),
      ('Inseticidas', 2),
      ('Fungicidas', 3),
      ('Acaricidas', 4),
      ('Adjuvantes', 5),
      ('Biológicos', 6),
      ('Reguladores de Crescimento', 7),
      ('Armadilhas e Iscas', 8),
      ('Equipamentos de Aplicação', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Energia Renovável
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Energia Renovável' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Energia Renovável > ' || sub.nome
    FROM (VALUES
      ('Painéis Solares', 1),
      ('Inversores', 2),
      ('Controladores de Carga', 3),
      ('Bombas Solares', 4),
      ('Estruturas e Suportes', 5),
      ('Cabos e Conectores', 6),
      ('Kits Off-Grid', 7),
      ('Aquecedores Solares', 8),
      ('Geradores Eólicos', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Equipamentos
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Equipamentos' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Equipamentos > ' || sub.nome
    FROM (VALUES
      ('Pulverizadores', 1),
      ('Roçadeiras', 2),
      ('Semeadoras', 3),
      ('Adubadeiras', 4),
      ('Plantadeiras', 5),
      ('Trituradores', 6),
      ('Colheitadeiras', 7),
      ('Ensiladeiras', 8),
      ('Implementos para Trator', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Ferramentas Agrícolas
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Ferramentas Agrícolas' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Ferramentas Agrícolas > ' || sub.nome
    FROM (VALUES
      ('Enxadas', 1),
      ('Pás e Picaretas', 2),
      ('Foices e Facões', 3),
      ('Tesouras de Poda', 4),
      ('Serras', 5),
      ('Pulverizadores Manuais', 6),
      ('Carrinhos de Mão', 7),
      ('Ferramentas de Medição', 8),
      ('Afiadores e Manutenção', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Ferramentas de Trabalho
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Ferramentas de Trabalho' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Ferramentas de Trabalho > ' || sub.nome
    FROM (VALUES
      ('EPIs', 1),
      ('Luvas', 2),
      ('Botas', 3),
      ('Macacões', 4),
      ('Óculos de Proteção', 5),
      ('Protetores Auriculares', 6),
      ('Cintos e Suportes', 7),
      ('Lanternas', 8),
      ('Mochilas e Bolsas', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Infra-estrutura Rural
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome IN ('Infra-estrutura Rural','Infraestrutura Rural') AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Infra-estrutura Rural > ' || sub.nome
    FROM (VALUES
      ('Cercas e Arames', 1),
      ('Portões e Ferragens', 2),
      ('Bebedouros e Cochos', 3),
      ('Galpões e Estruturas', 4),
      ('Pisos e Revestimentos', 5),
      ('Telas e Sombrite', 6),
      ('Mangueiras e Conexões', 7),
      ('Galinheiros e Viveiros', 8),
      ('Iluminação Rural', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Insumos Agrícolas
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Insumos Agrícolas' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Insumos Agrícolas > ' || sub.nome
    FROM (VALUES
      ('Calcário e Gesso', 1),
      ('Micronutrientes', 2),
      ('Substratos', 3),
      ('Corretivos', 4),
      ('Adubos Orgânicos', 5),
      ('Bioestimulantes', 6),
      ('Inoculantes', 7),
      ('Acondicionadores de Solo', 8),
      ('Adubação Foliar', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Máquinas Agrícolas
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Máquinas Agrícolas' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Máquinas Agrícolas > ' || sub.nome
    FROM (VALUES
      ('Tratores', 1),
      ('Colheitadeiras', 2),
      ('Plantadeiras', 3),
      ('Semeadoras', 4),
      ('Adubadeiras', 5),
      ('Pulverizadores', 6),
      ('Enfardadeiras', 7),
      ('Grade e Arado', 8),
      ('Implementos Gerais', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Insumos Gadeiros (mantendo nome como está no banco)
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Insumos Gadeiros' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Insumos Gadeiros > ' || sub.nome
    FROM (VALUES
      ('Rações', 1),
      ('Núcleos e Concentrados', 2),
      ('Sal Mineral', 3),
      ('Vitaminas e Suplementos', 4),
      ('Vermífugos', 5),
      ('Seringas e Aplicadores', 6),
      ('Bebedouros', 7),
      ('Cochos', 8),
      ('Identificação (Brincos)', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Mudas e Sementes
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Mudas e Sementes' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Mudas e Sementes > ' || sub.nome
    FROM (VALUES
      ('Sementes de Grãos', 1),
      ('Sementes de Hortaliças', 2),
      ('Sementes de Forrageiras', 3),
      ('Mudas de Frutíferas', 4),
      ('Mudas de Flores', 5),
      ('Mudas de Árvores', 6),
      ('Sementes Tratadas', 7),
      ('Sementes Orgânicas', 8),
      ('Bulbos e Rizomas', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Irrigação
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Irrigação' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Irrigação > ' || sub.nome
    FROM (VALUES
      ('Mangueiras Gotejadoras', 1),
      ('Filtros', 2),
      ('Válvulas', 3),
      ('Bicos e Emissores', 4),
      ('Bombas', 5),
      ('Tubulações', 6),
      ('Conectores', 7),
      ('Controladores e Timers', 8),
      ('Aspersores', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Pecuária
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Pecuária' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Pecuária > ' || sub.nome
    FROM (VALUES
      ('Ordenha', 1),
      ('Contenção e Manejo', 2),
      ('Balanças e Pesagem', 3),
      ('Cercas Elétricas', 4),
      ('Nutrição', 5),
      ('Sanidade', 6),
      ('Refrigeração de Leite', 7),
      ('Identificação', 8),
      ('Ferramentas para Pecuária', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Maquinaria Agrícola
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Maquinaria Agrícola' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Maquinaria Agrícola > ' || sub.nome
    FROM (VALUES
      ('Implementos para Trator', 1),
      ('Colheitadeiras', 2),
      ('Plantadeiras', 3),
      ('Semeadoras', 4),
      ('Pulverizadores', 5),
      ('Grades e Arados', 6),
      ('Enfardadeiras', 7),
      ('Reboques e Carretas', 8),
      ('Peças e Acessórios', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Suplementos
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Suplementos' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Suplementos > ' || sub.nome
    FROM (VALUES
      ('Minerais', 1),
      ('Proteicos', 2),
      ('Energéticos', 3),
      ('Núcleos', 4),
      ('Pré-mix', 5),
      ('Probióticos', 6),
      ('Vitaminas', 7),
      ('Aditivos', 8),
      ('Blocos e Lambedores', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Máquinas Forrageiras
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Máquinas Forrageiras' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Máquinas Forrageiras > ' || sub.nome
    FROM (VALUES
      ('Ensiladeiras', 1),
      ('Forrageiras de Arrasto', 2),
      ('Picadores', 3),
      ('Desintegradores', 4),
      ('Enfardadeiras', 5),
      ('Rotores e Emissores', 6),
      ('Peças e Manutenção', 7),
      ('Carretas Forrageiras', 8),
      ('Acessórios', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Produção Animal (mantendo grafia existente "Produçao Animal")
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome IN ('Produção Animal','Produçao Animal') AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Produção Animal > ' || sub.nome
    FROM (VALUES
      ('Avicultura', 1),
      ('Suinocultura', 2),
      ('Bovinocultura de Corte', 3),
      ('Bovinocultura de Leite', 4),
      ('Ovinocaprinocultura', 5),
      ('Aquicultura', 6),
      ('Apicultura', 7),
      ('Cunicultura', 8),
      ('Nutrição e Sanidade', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Proteção de Culturas
  SELECT id INTO category_id FROM public.categorias_catalogo 
   WHERE nivel = 2 AND nome = 'Proteção de Culturas' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NOT NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Agro > Proteção de Culturas > ' || sub.nome
    FROM (VALUES
      ('Controle de Pragas', 1),
      ('Controle de Doenças', 2),
      ('Controle de Plantas Daninhas', 3),
      ('Bioproteção', 4),
      ('Monitoramento', 5),
      ('Armadilhas', 6),
      ('Coberturas e Barreiras', 7),
      ('Feromônios', 8),
      ('Equipamentos de Aplicação', 9),
      ('Outros', 10)
    ) AS sub(nome, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = sub.nome
    );
  END IF;

  -- Caso existam outras L2 sob Agro não contempladas acima, garantir pelo menos um "Outros"
  -- para qualquer L2 sem N3
  FOR category_id IN
    SELECT id FROM public.categorias_catalogo
    WHERE nivel = 2 AND categoria_principal_id = principal_id
      AND NOT EXISTS (
        SELECT 1 FROM public.categorias_catalogo l3
        WHERE l3.nivel = 3 AND l3.categoria_id = categorias_catalogo.id
      )
  LOOP
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
    SELECT 3, 'Outros', 999, true, principal_id, category_id,
           (SELECT 'Agro > ' || l2.nome || ' > Outros' FROM public.categorias_catalogo l2 WHERE l2.id = category_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categorias_catalogo 
      WHERE nivel = 3 AND categoria_id = category_id AND nome = 'Outros'
    );
  END LOOP;
END $$;