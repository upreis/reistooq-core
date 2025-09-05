-- Continuar com as demais categorias principais

-- CONSTRUÇÃO
WITH construcao_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Construção'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, construcao_id.id, 'Construção > ' || categoria
FROM construcao_id,
(VALUES 
  ('Aberturas', 1),
  ('Acessórios de Construção', 2),
  ('Encanamento', 3),
  ('Energia', 4),
  ('Loja de Tintas', 5),
  ('Materiais de Obra', 6),
  ('Mobiliário para Banheiros', 7),
  ('Mobiliário para Cozinhas', 8),
  ('Máquinas para Construção', 9),
  ('Outros', 10),
  ('Pisos e Rejuntes', 11)
) AS cat(categoria, ordem);

-- ELETRODOMÉSTICOS
WITH eletro_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Eletrodomésticos'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, eletro_id.id, 'Eletrodomésticos > ' || categoria
FROM eletro_id,
(VALUES 
  ('Ar e Ventilação', 1),
  ('Bebedouros e Purificadores', 2),
  ('Cuidado Pessoal', 3),
  ('Fornos e Fogões', 4),
  ('Lavadoras', 5),
  ('Outros', 6),
  ('Pequenos Eletrodomésticos', 7),
  ('Refrigeração', 8)
) AS cat(categoria, ordem);

-- ELETRÔNICOS, ÁUDIO E VÍDEO
WITH eletronicos_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Eletrônicos, Áudio e Vídeo'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, eletronicos_id.id, 'Eletrônicos, Áudio e Vídeo > ' || categoria
FROM eletronicos_id,
(VALUES 
  ('Acessórios para TV', 1),
  ('Acessórios para Áudio e Vídeo', 2),
  ('Aparelhos DVD e Bluray', 3),
  ('Bolsas e Estojos', 4),
  ('Cabos', 5),
  ('Componentes Eletrônicos', 6),
  ('Controles Remotos', 7),
  ('Drones e Acessórios', 8),
  ('Media Streaming', 9),
  ('Outros Eletrônicos', 10),
  ('Peças para TV', 11),
  ('Pilhas e Carregadores', 12),
  ('Projetores e Telas', 13),
  ('Televisores', 14),
  ('Áudio', 15)
) AS cat(categoria, ordem);

-- ESPORTES E FITNESS
WITH esportes_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Esportes e Fitness'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, esportes_id.id, 'Esportes e Fitness > ' || categoria
FROM esportes_id,
(VALUES 
  ('Artes Marciais e Boxe', 1),
  ('Badminton', 2),
  ('Basquete', 3),
  ('Beisebol e Softbol', 4),
  ('Camping, Caça e Pesca', 5),
  ('Canoas, Caiaques e Infláveis', 6),
  ('Ciclismo', 7),
  ('Cotoveleiras', 8),
  ('Equitação', 9),
  ('Esgrima', 10),
  ('Esqui e Snowboard', 11),
  ('Fitness e Musculação', 12),
  ('Futebol', 13),
  ('Futebol Americano', 14),
  ('Golfe', 15),
  ('Handebol', 16),
  ('Hóquei', 17),
  ('Jogos de Salão', 18),
  ('Kitesurf', 19),
  ('Mergulho', 20),
  ('Moda Fitness', 21),
  ('Monitores Esportivos', 22),
  ('Natação', 23),
  ('Outros', 24),
  ('Paintball', 25),
  ('Parapente', 26),
  ('Patinetes e Scooters', 27),
  ('Patin e Skateboard', 28),
  ('Pilates e Yoga', 29),
  ('Rapel, Montanhismo e Escalada', 30),
  ('Rugby', 31),
  ('Slackline', 32),
  ('Suplementos e Shakers', 33),
  ('Surf e Bodyboard', 34),
  ('Tiro Esportivo', 35),
  ('Tênis', 36),
  ('Tênis, Paddle e Squash', 37),
  ('Vôlei', 38),
  ('Wakeboard e Esqui Acuático', 39),
  ('Windsurf', 40)
) AS cat(categoria, ordem);

-- FERRAMENTAS
WITH ferramentas_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Ferramentas'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, ferramentas_id.id, 'Ferramentas > ' || categoria
FROM ferramentas_id,
(VALUES 
  ('Acessórios para Ferramentas', 1),
  ('Caixas e Organizadores', 2),
  ('Ferramentas Elétricas', 3),
  ('Ferramentas Industriais', 4),
  ('Ferramentas Manuais', 5),
  ('Ferramentas para Jardim', 6),
  ('Ferramentas Pneumáticas', 7),
  ('Medições e Instrumentação', 8),
  ('Outros', 9)
) AS cat(categoria, ordem);