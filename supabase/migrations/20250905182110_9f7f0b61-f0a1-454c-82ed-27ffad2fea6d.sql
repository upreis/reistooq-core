-- Continuar inserindo TODAS as categorias Nível 2 restantes

-- CALÇADOS, ROUPAS E BOLSAS
WITH roupas_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Calçados, Roupas e Bolsas'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, roupas_id.id, 'Calçados, Roupas e Bolsas > ' || categoria
FROM roupas_id,
(VALUES 
  ('Acessórios de Moda', 1),
  ('Agasalhos', 2),
  ('Bermudas e Shorts', 3),
  ('Blusas', 4),
  ('Calçados', 5),
  ('Calças', 6),
  ('Camisas', 7),
  ('Camisetas e Regatas', 8),
  ('Indumentária Laboral e Escolar', 9),
  ('Kimonos', 10),
  ('Kits de Conjuntos de Roupa', 11),
  ('Leggings', 12),
  ('Macacão', 13),
  ('Malas e Bolsas', 14),
  ('Moda Fitness', 15),
  ('Moda Praia', 16),
  ('Moda Íntima e Lingerie', 17),
  ('Outros', 18),
  ('Roupas para Bebês', 19),
  ('Saias', 20),
  ('Ternos', 21),
  ('Vestidos', 22)
) AS cat(categoria, ordem);

-- CÂMERAS E ACESSÓRIOS
WITH cameras_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Câmeras e Acessórios'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, cameras_id.id, 'Câmeras e Acessórios > ' || categoria
FROM cameras_id,
(VALUES 
  ('Acessórios para Câmeras', 1),
  ('Cabos', 2),
  ('Câmeras', 3),
  ('Drones e Acessórios', 4),
  ('Equipamento de Revelação', 5),
  ('Filmadoras', 6),
  ('Instrumentos Ópticos', 7),
  ('Lentes e Filtros', 8),
  ('Outros', 9),
  ('Peças para Câmeras', 10),
  ('Álbuns e Porta-retratos', 11)
) AS cat(categoria, ordem);

-- CARROS, MOTOS E OUTROS
WITH carros_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Carros, Motos e Outros'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, carros_id.id, 'Carros, Motos e Outros > ' || categoria
FROM carros_id,
(VALUES 
  ('Caminhões', 1),
  ('Carros Antigos', 2),
  ('Carros e Caminhonetes', 3),
  ('Consórcios', 4),
  ('Motorhomes', 5),
  ('Motos', 6),
  ('Náutica', 7),
  ('Outros Veículos', 8),
  ('Veículos Pesados', 9),
  ('Ônibus', 10)
) AS cat(categoria, ordem);

-- CASA, MÓVEIS E DECORAÇÃO
WITH casa_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Casa, Móveis e Decoração'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, casa_id.id, 'Casa, Móveis e Decoração > ' || categoria
FROM casa_id,
(VALUES 
  ('Banheiros', 1),
  ('Camas, Colchões e Acessórios', 2),
  ('Cozinha', 3),
  ('Cuidado da Casa e Lavanderia', 4),
  ('Enfeites e Decoração da Casa', 5),
  ('Iluminação Residencial', 6),
  ('Jardim e Ar Livre', 7),
  ('Móveis para Casa', 8),
  ('Organização para Casa', 9),
  ('Outros', 10),
  ('Segurança para Casa', 11),
  ('Têxteis de Casa e Decoração', 12)
) AS cat(categoria, ordem);

-- CELULARES E TELEFONES
WITH celulares_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Celulares e Telefones'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, celulares_id.id, 'Celulares e Telefones > ' || categoria
FROM celulares_id,
(VALUES 
  ('Acessórios para Celulares', 1),
  ('Celulares e Smartphones', 2),
  ('Outros', 3),
  ('Peças para Celular', 4),
  ('Rádio Comunicadores', 5),
  ('Smartwatches e Acessórios', 6),
  ('Tarifadores e Cabines', 7),
  ('Telefonia Fixa e Sem Fio', 8),
  ('VoIP', 9),
  ('Óculos de Realidade Virtual', 10)
) AS cat(categoria, ordem);

-- CONSOLES E VIDEO GAMES
WITH consoles_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Consoles e Video Games'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, consoles_id.id, 'Consoles e Video Games > ' || categoria
FROM consoles_id,
(VALUES 
  ('Acessórios para Consoles', 1),
  ('Acessórios para PC Gaming', 2),
  ('Consoles', 3),
  ('Fliperama e Arcade', 4),
  ('Outros', 5),
  ('Peças para Consoles', 6),
  ('Video Games', 7)
) AS cat(categoria, ordem);