-- Completar o catálogo com todas as categorias restantes
DO $$
DECLARE
  v_created_l1 int := 0;
  v_created_l2 int := 0; 
  v_created_l3 int := 0;
  principal_id uuid;
  category_id uuid;
BEGIN

-- F) FESTAS E LEMBRANCINHAS
SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Festas e Lembrancinhas' LIMIT 1;
IF principal_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
  VALUES (1, 'Festas e Lembrancinhas', 19, true, 'Festas e Lembrancinhas')
  RETURNING id INTO principal_id;
  v_created_l1 := v_created_l1 + 1;
END IF;

-- Artigos para Festas
SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Artigos para Festas' AND categoria_principal_id = principal_id LIMIT 1;
IF category_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
  VALUES (2, 'Artigos para Festas', 1, true, principal_id, 'Festas e Lembrancinhas > Artigos para Festas')
  RETURNING id INTO category_id;
  v_created_l2 := v_created_l2 + 1;
END IF;

INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Festas e Lembrancinhas > Artigos para Festas > ' || sub.nome
FROM (VALUES 
  ('Anéis', 1), ('Apitos', 2), ('Bandoletes, Coroas e Tiaras', 3), ('Chapéus', 4),
  ('Figuras Fluorescentes', 5), ('Kits de Festa', 6), ('Perucas, Barbas y Bigodes', 7),
  ('Pulseiras e Colares', 8), ('Óculos de Festa', 9)
) AS sub(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

-- Decoração de Festa
SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Decoração de Festa' AND categoria_principal_id = principal_id LIMIT 1;
IF category_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
  VALUES (2, 'Decoração de Festa', 2, true, principal_id, 'Festas e Lembrancinhas > Decoração de Festa')
  RETURNING id INTO category_id;
  v_created_l2 := v_created_l2 + 1;
END IF;

INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Festas e Lembrancinhas > Decoração de Festa > ' || sub.nome
FROM (VALUES 
  ('Balões e Acessórios', 1), ('Banderinhas e Guirlandas', 2), ('Centros de Mesa', 3),
  ('Cortinas para Festas', 4), ('Estrelinhas e Velas', 5), ('Kits de Decoração', 6),
  ('Luzes Submersíveis', 7), ('Lâmpadas de Papel', 8), ('Mesa de Doces e Confeitaria', 9),
  ('Painéis de Festa', 10), ('Pendentes', 11), ('Pompons para Festa', 12), ('Toalhas de Mesa', 13)
) AS sub(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

-- Descartáveis para Festa
SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Descartáveis para Festa' AND categoria_principal_id = principal_id LIMIT 1;
IF category_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
  VALUES (2, 'Descartáveis para Festa', 3, true, principal_id, 'Festas e Lembrancinhas > Descartáveis para Festa')
  RETURNING id INTO category_id;
  v_created_l2 := v_created_l2 + 1;
END IF;

INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Festas e Lembrancinhas > Descartáveis para Festa > ' || sub.nome
FROM (VALUES 
  ('Caixas para Pipocas', 1), ('Canudos', 2), ('Copos Descartáveis', 3), ('Guardanapos', 4),
  ('Kits Descartáveis', 5), ('Pratos', 6), ('Taças', 7), ('Tigelas', 8), ('Utensílios', 9)
) AS sub(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

-- G) GAMES
SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Games' LIMIT 1;
IF principal_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
  VALUES (1, 'Games', 20, true, 'Games')
  RETURNING id INTO principal_id;
  v_created_l1 := v_created_l1 + 1;
END IF;

-- Acessórios para Consoles
SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Acessórios para Consoles' AND categoria_principal_id = principal_id LIMIT 1;
IF category_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
  VALUES (2, 'Acessórios para Consoles', 1, true, principal_id, 'Games > Acessórios para Consoles')
  RETURNING id INTO category_id;
  v_created_l2 := v_created_l2 + 1;
END IF;

INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Games > Acessórios para Consoles > ' || sub.nome
FROM (VALUES 
  ('Para Atari', 1), ('Para NeoGeo', 2), ('Para Nintendo', 3), ('Para Outros Consoles', 4),
  ('Para PlayStation', 5), ('Para SEGA', 6), ('Para Xbox', 7), ('PlayStation 2', 8)
) AS sub(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

-- Fliperamas e Arcade
SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Fliperamas e Arcade' AND categoria_principal_id = principal_id LIMIT 1;
IF category_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
  VALUES (2, 'Fliperamas e Arcade', 2, true, principal_id, 'Games > Fliperamas e Arcade')
  RETURNING id INTO category_id;
  v_created_l2 := v_created_l2 + 1;
END IF;

INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Games > Fliperamas e Arcade > ' || sub.nome
FROM (VALUES 
  ('Máquinas', 1)
) AS sub(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

RAISE NOTICE 'Migration completed successfully. Created: L1=%, L2=%, L3=%', v_created_l1, v_created_l2, v_created_l3;

END $$;