-- Completar o catálogo com todas as categorias restantes
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
  RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
END IF;

-- Artigos para Festas
SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Artigos para Festas' AND categoria_principal_id = principal_id LIMIT 1;
IF category_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
  VALUES (2, 'Artigos para Festas', 1, true, principal_id, 'Festas e Lembrancinhas > Artigos para Festas')
  RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
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
  RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
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
  RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
END IF;
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Festas e Lembrancinhas > Descartáveis para Festa > ' || sub.nome
FROM (VALUES 
  ('Caixas para Pipocas', 1), ('Canudos', 2), ('Copos Descartáveis', 3), ('Guardanapos', 4),
  ('Kits Descartáveis', 5), ('Pratos', 6), ('Taças', 7), ('Tigelas', 8), ('Utensílios', 9)
) AS sub(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

-- G) ESPORTES E FITNESS (Expandindo)
SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Esportes e Fitness' LIMIT 1;

-- Fitness e Musculação (expandida)
SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Fitness e Musculação' AND categoria_principal_id = principal_id LIMIT 1;
IF category_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
  VALUES (2, 'Fitness e Musculação', 1, true, principal_id, 'Esportes e Fitness > Fitness e Musculação')
  RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
END IF;
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Esportes e Fitness > Fitness e Musculação > ' || sub.nome
FROM (VALUES 
  ('Aparelhos Cardiovasculares', 1), ('Aparelhos de Musculação', 2), ('Funcional, Pilates e Yoga', 3),
  ('Halteres, Discos e Anilhas', 4), ('Proteção e Reabilitação', 5)
) AS sub(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

-- Futebol
SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Futebol' AND categoria_principal_id = principal_id LIMIT 1;
IF category_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
  VALUES (2, 'Futebol', 2, true, principal_id, 'Esportes e Fitness > Futebol')
  RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
END IF;
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Esportes e Fitness > Futebol > ' || sub.nome
FROM (VALUES 
  ('Bolsas e Porta-chuteiras', 1), ('Equipamento e Treinamento', 2)
) AS sub(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

-- H) FERRAMENTAS (Expandindo)
SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Ferramentas' LIMIT 1;

-- Ferramentas Elétricas (expandida)
SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Ferramentas Elétricas' AND categoria_principal_id = principal_id LIMIT 1;
IF category_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
  VALUES (2, 'Ferramentas Elétricas', 1, true, principal_id, 'Ferramentas > Ferramentas Elétricas')
  RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
END IF;
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Ferramentas > Ferramentas Elétricas > ' || sub.nome
FROM (VALUES 
  ('Afiadores', 1), ('Amarradoras de Vergalhão', 2), ('Chaves de Impacto', 3), ('Compressores de Ar', 4),
  ('Corte', 5), ('Detectores de Metais', 6), ('Equipamento de Pintura', 7), ('Kit de Ferramentas Elétricas', 8),
  ('Limpeza', 9), ('Lixado, Desbaste y Polimento', 10), ('Misturadores de Tinta', 11),
  ('Multiferramentas Oscilantes', 12), ('Parafusadeiras', 13), ('Perfuração', 14), ('Pirógrafos', 15),
  ('Pistolas de Pintura', 16), ('Soldagem', 17), ('Sopradores Térmicos', 18), ('Termofusoras', 19)
) AS sub(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

-- Ferramentas Manuais (expandida)
SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Ferramentas Manuais' AND categoria_principal_id = principal_id LIMIT 1;
IF category_id IS NULL THEN
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
  VALUES (2, 'Ferramentas Manuais', 2, true, principal_id, 'Ferramentas > Ferramentas Manuais')
  RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
END IF;
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, principal_id, category_id, 'Ferramentas > Ferramentas Manuais > ' || sub.nome
FROM (VALUES 
  ('Alicates', 1), ('Almotolias', 2), ('Alvenaria', 3), ('Bigornas', 4), ('Chaves Michas', 5),
  ('Corte e Desbaste', 6), ('Elevação e Tração', 7), ('Engraxadeiras', 8), ('Espelhos de Inspeção', 9),
  ('Extração', 10), ('Fixação', 11), ('Grampos Sargento', 12), ('Kits de Ferramentas', 13),
  ('Martelos', 14), ('Maçaricos', 15), ('Morsas', 16), ('Pernas Mecânicas', 17), ('Ventosas para Desamassar', 18)
) AS sub(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

RETURN json_build_object('success', true, 'created_level1', v_created_l1, 'created_level2', v_created_l2, 'created_level3', v_created_l3);
END;