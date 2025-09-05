-- Inserir TODAS as categorias Nível 2 do Mercado Livre para cada categoria principal

-- ALIMENTOS E BEBIDAS
WITH alimentos_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Alimentos e Bebidas'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, alimentos_id.id, 'Alimentos e Bebidas > ' || categoria
FROM alimentos_id,
(VALUES 
  ('Bebidas', 1),
  ('Comida Preparada', 2),
  ('Congelados', 3),
  ('Frescos', 4),
  ('Kefir', 5),
  ('Mercearia', 6),
  ('Outros', 7)
) AS cat(categoria, ordem);

-- PET SHOP
WITH petshop_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Pet Shop'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, petshop_id.id, 'Pet Shop > ' || categoria
FROM petshop_id,
(VALUES 
  ('Anfíbios e Répteis', 1),
  ('Aves e Acessórios', 2),
  ('Botas', 3),
  ('Capas de chuva', 4),
  ('Cavalos', 5),
  ('Cintos de segurança', 6),
  ('Coelhos', 7),
  ('Coleiras', 8),
  ('Cortadores de Unhas', 9),
  ('Creme Dental', 10),
  ('Cães', 11),
  ('Escovas e Pentes', 12),
  ('Fraldas', 13),
  ('Gaiolas para Animais', 14),
  ('Gatos', 15),
  ('Guias para Animais', 16),
  ('Insetos', 17),
  ('Laços', 18),
  ('Outros', 19),
  ('Peixes', 20),
  ('Petiscos para Animais', 21),
  ('Recipiente para Ração', 22),
  ('Repelentes Ultrassônicos', 23),
  ('Roedores', 24),
  ('Roupas de Inverno', 25),
  ('Sabonete', 26)
) AS cat(categoria, ordem);

-- ANTIGUIDADES E COLEÇÕES
WITH antiguidades_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Antiguidades e Coleções'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, antiguidades_id.id, 'Antiguidades e Coleções > ' || categoria
FROM antiguidades_id,
(VALUES 
  ('Antiguidades', 1),
  ('Bandeiras', 2),
  ('Colecionáveis de Esportes', 3),
  ('Cédulas e Moedas', 4),
  ('Esculturas', 5),
  ('Filatelia', 6),
  ('Militaria e Afins', 7),
  ('Outras Antiguidades', 8),
  ('Pôsteres', 9)
) AS cat(categoria, ordem);

-- ARTE, PAPELARIA E ARMARINHO
WITH arte_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Arte, Papelaria e Armarinho'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, arte_id.id, 'Arte, Papelaria e Armarinho > ' || categoria
FROM arte_id,
(VALUES 
  ('Arte e Trabalhos Manuais', 1),
  ('Artigos de Armarinho', 2),
  ('Materiais Escolares', 3),
  ('Outros', 4)
) AS cat(categoria, ordem);

-- BEBÊS
WITH bebes_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Bebês'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, bebes_id.id, 'Bebês > ' || categoria
FROM bebes_id,
(VALUES 
  ('Alimentação e Amamentação', 1),
  ('Alimentos para Bebês', 2),
  ('Andadores e Mini Veículos', 3),
  ('Banho do Bebê', 4),
  ('Brinquedos para Bebês', 5),
  ('Cercadinho', 6),
  ('Chupetas e Mordedores', 7),
  ('Higiene e Cuidados com o Bebê', 8),
  ('Maternidade', 9),
  ('Outros', 10),
  ('Passeio do Bebê', 11),
  ('Quarto do Bebê', 12),
  ('Roupas de Bebê', 13),
  ('Saúde do Bebê', 14),
  ('Segurança para Bebê', 15)
) AS cat(categoria, ordem);

-- BELEZA E CUIDADO PESSOAL
WITH beleza_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Beleza e Cuidado Pessoal'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, beleza_id.id, 'Beleza e Cuidado Pessoal > ' || categoria
FROM beleza_id,
(VALUES 
  ('Artefatos para Cabelo', 1),
  ('Artigos para Cabeleireiros', 2),
  ('Barbearia', 3),
  ('Cuidados com a Pele', 4),
  ('Cuidados com o Cabelo', 5),
  ('Depilação', 6),
  ('Farmácia', 7),
  ('Higiene Pessoal', 8),
  ('Manicure e Pedicure', 9),
  ('Maquiagem', 10),
  ('Outros', 11),
  ('Perfumes', 12),
  ('Tratamentos de Beleza', 13)
) AS cat(categoria, ordem);

-- BRINQUEDOS E HOBBIES
WITH brinquedos_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Brinquedos e Hobbies'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, brinquedos_id.id, 'Brinquedos e Hobbies > ' || categoria
FROM brinquedos_id,
(VALUES 
  ('Anti-stress e Engenho', 1),
  ('Ar Livre e Playground', 2),
  ('Artes e Atividades', 3),
  ('Bonecos e Bonecas', 4),
  ('Brinquedos Eletrônicos', 5),
  ('Brinquedos de Faz de Conta', 6),
  ('Brinquedos de Montar', 7),
  ('Brinquedos de Pegadinhas', 8),
  ('Brinquedos de Praia e Piscina', 9),
  ('Brinquedos para Bebês', 10),
  ('Casinhas e Barracas', 11),
  ('Fantoches e Marionetas', 12),
  ('Hobbies', 13),
  ('Instrumentos Musicais', 14),
  ('Jogos de Salão', 15),
  ('Jogos de Tabuleiro e Cartas', 16),
  ('Lançadores de Brinquedo', 17),
  ('Mesas e Cadeiras', 18),
  ('Mini Veículos e Bicicletas', 19),
  ('Outros', 20),
  ('Patins e Skates', 21),
  ('Pelúcias', 22),
  ('Piscinas de Bolas e Infláveis', 23),
  ('Veículos de Brinquedo', 24),
  ('Álbuns e Figurinhas', 25)
) AS cat(categoria, ordem);