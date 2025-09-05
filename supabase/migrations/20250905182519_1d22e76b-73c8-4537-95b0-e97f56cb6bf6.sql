-- Finalizar com as últimas categorias principais

-- FESTAS E LEMBRANCINHAS
WITH festas_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Festas e Lembrancinhas'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, festas_id.id, 'Festas e Lembrancinhas > ' || categoria
FROM festas_id,
(VALUES 
  ('Artigos para Festas', 1),
  ('Convites', 2),
  ('Decoração de Festa', 3),
  ('Descartáveis para Festa', 4),
  ('Equipamento para Festas', 5),
  ('Espuma, Serpentinas e Confete', 6),
  ('Fantasias e Cosplay', 7),
  ('Garrafas', 8),
  ('Kits Imprimíveis para Festas', 9),
  ('Lembrancinhas', 10),
  ('Lembrancinhas para Festas', 11),
  ('Outros', 12),
  ('Plaquinhas para Festas', 13)
) AS cat(categoria, ordem);

-- GAMES
WITH games_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Games'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, games_id.id, 'Games > ' || categoria
FROM games_id,
(VALUES 
  ('Acessórios para Consoles', 1),
  ('Acessórios para PC Gaming', 2),
  ('Consoles', 3),
  ('Fliperama e Arcade', 4),
  ('Outros', 5),
  ('Peças para Consoles', 6),
  ('Video Games', 7)
) AS cat(categoria, ordem);

-- IMÓVEIS
WITH imoveis_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Imóveis'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, imoveis_id.id, 'Imóveis > ' || categoria
FROM imoveis_id,
(VALUES 
  ('Apartamentos', 1),
  ('Casas', 2),
  ('Chácaras', 3),
  ('Fazendas', 4),
  ('Flat - Apart Hotel', 5),
  ('Galpões', 6),
  ('Lojas Comerciais', 7),
  ('Outros Imóveis', 8),
  ('Salas Comerciais', 9),
  ('Sítios', 10),
  ('Terrenos', 11)
) AS cat(categoria, ordem);

-- INDÚSTRIA E COMÉRCIO
WITH industria_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Indústria e Comércio'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, industria_id.id, 'Indústria e Comércio > ' || categoria
FROM industria_id,
(VALUES 
  ('Arquitetura e Desenho', 1),
  ('Embalagem e Logística', 2),
  ('Equipamento Médico', 3),
  ('Equipamento para Comércios', 4),
  ('Equipamento para Escritórios', 5),
  ('Ferramentas Industriais', 6),
  ('Gastronomia e Hotelaria', 7),
  ('Gráfica e Impressão', 8),
  ('Outros', 9),
  ('Publicidade e Promoção', 10),
  ('Segurança Laboral', 11),
  ('Têxtil e Calçado', 12),
  ('Uniformes e Roupa de Trabalho', 13)
) AS cat(categoria, ordem);

-- INFORMÁTICA
WITH informatica_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Informática'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, informatica_id.id, 'Informática > ' || categoria
FROM informatica_id,
(VALUES 
  ('Acessórios de Antiestática', 1),
  ('Acessórios para PC Gaming', 2),
  ('Armazenamento', 3),
  ('Cabos e Hubs USB', 4),
  ('Componentes para PC', 5),
  ('Conectividade e Redes', 6),
  ('Estabilizadores e No Breaks', 7),
  ('Impressão', 8),
  ('Leitores e Scanners', 9),
  ('Limpeza de PCs', 10),
  ('Monitores e Acessórios', 11),
  ('Outros', 12),
  ('PC de Mesa', 13),
  ('Palms e Handhelds', 14),
  ('Periféricos para PC', 15),
  ('Portáteis e Acessórios', 16),
  ('Projetores e Telas', 17),
  ('Softwares', 18),
  ('Tablets e Acessórios', 19)
) AS cat(categoria, ordem);

-- INSTRUMENTOS MUSICAIS
WITH musica_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Instrumentos Musicais'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, musica_id.id, 'Instrumentos Musicais > ' || categoria
FROM musica_id,
(VALUES 
  ('Baterias e Percussão', 1),
  ('Caixas de Som', 2),
  ('Equipamento para DJs', 3),
  ('Estúdio de Gravação', 4),
  ('Instrumentos de Corda', 5),
  ('Instrumentos de Sopro', 6),
  ('Metrónomos', 7),
  ('Microfones e Amplificadores', 8),
  ('Outros', 9),
  ('Partituras e Letras', 10),
  ('Pedais e Acessórios', 11),
  ('Pianos e Teclados', 12)
) AS cat(categoria, ordem);

-- JOIAS E RELÓGIOS
WITH joias_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Joias e Relógios'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, joias_id.id, 'Joias e Relógios > ' || categoria
FROM joias_id,
(VALUES 
  ('Acessórios Para Relógios', 1),
  ('Artigos de Joalharia', 2),
  ('Canetas e Lapiseiras de Luxo', 3),
  ('Joias e Bijuterias', 4),
  ('Outros', 5),
  ('Pedra Preciosa e Semipreciosa', 6),
  ('Piercings', 7),
  ('Porta Joias', 8),
  ('Relógios', 9)
) AS cat(categoria, ordem);

-- LIVROS, REVISTAS E COMICS
WITH livros_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Livros, Revistas e Comics'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, livros_id.id, 'Livros, Revistas e Comics > ' || categoria
FROM livros_id,
(VALUES 
  ('Catálogos', 1),
  ('Ebooks', 2),
  ('Livros Físicos', 3),
  ('Outros', 4),
  ('Revistas', 5)
) AS cat(categoria, ordem);

-- Restantes categorias simples
-- MÚSICA, FILMES E SERIADOS
WITH midia_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Música, Filmes e Seriados'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, midia_id.id, 'Música, Filmes e Seriados > ' || categoria
FROM midia_id,
(VALUES 
  ('Conteúdo Esportivo', 1),
  ('Cursos Completos', 2),
  ('Filmes Físicos', 3),
  ('Filmes Online', 4),
  ('Música', 5),
  ('Outros', 6),
  ('Seriados', 7),
  ('Seriados Online', 8),
  ('Vídeos de Receitas e DIY', 9)
) AS cat(categoria, ordem);

-- SAÚDE
WITH saude_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Saúde'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, saude_id.id, 'Saúde > ' || categoria
FROM saude_id,
(VALUES 
  ('Cuidado da Saúde', 1),
  ('Equipamento Médico', 2),
  ('Massagem', 3),
  ('Mobilidade', 4),
  ('Ortopedia', 5),
  ('Outros', 6),
  ('Suplementos Alimentares', 7),
  ('Terapias Alternativas', 8)
) AS cat(categoria, ordem);

-- SERVIÇOS
WITH servicos_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Serviços'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, servicos_id.id, 'Serviços > ' || categoria
FROM servicos_id,
(VALUES 
  ('Academia e Esportes', 1),
  ('Animais', 2),
  ('Beleza, Estética e Bem Estar', 3),
  ('Educação', 4),
  ('Festas e Eventos', 5),
  ('Gastronomia', 6),
  ('Gráficas e Impressão', 7),
  ('Lar', 8),
  ('Marketing e Internet', 9),
  ('Outros Profissionais', 10),
  ('Outros Serviços', 11),
  ('Saúde', 12),
  ('Suporte Técnico', 13),
  ('Vestuário', 14),
  ('Veículos e Transportes', 15),
  ('Viagens e Turismo', 16)
) AS cat(categoria, ordem);

-- Demais categorias finais com subcategorias simples
-- SOUVENIRS, LEMBRANCINHAS E ARTESANATO
WITH souvenirs_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Souvenirs, Lembrancinhas e Artesanato'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, souvenirs_id.id, 'Souvenirs, Lembrancinhas e Artesanato > ' || categoria
FROM souvenirs_id,
(VALUES 
  ('Artigos para Fumadores', 1),
  ('Assinatura do MELI Plus', 2),
  ('Bijutas de Vento', 3),
  ('Bundle', 4),
  ('Coberturas Estendidas', 5),
  ('Criptomoedas', 6),
  ('Defletores de Vento', 7),
  ('Equipamento para Tatuagens', 8),
  ('Esoterismo e Ocultismo', 9),
  ('Fornos Crematórios', 10),
  ('Gift Cards', 11),
  ('Health', 12),
  ('Licenças para Taxis', 13),
  ('Outros', 14)
) AS cat(categoria, ordem);

-- TÊNIS (categoria separada)
WITH tenis_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Tênis'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, tenis_id.id, 'Tênis > ' || categoria
FROM tenis_id,
(VALUES 
  ('Tênis Masculino', 1),
  ('Tênis Feminino', 2),
  ('Tênis Infantil', 3),
  ('Tênis de Corrida', 4),
  ('Tênis Casual', 5),
  ('Tênis Esportivo', 6),
  ('Outros', 7)
) AS cat(categoria, ordem);

-- RELÓGIOS E JOIAS (segunda categoria)
WITH relogios_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Relógios e Joias'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, relogios_id.id, 'Relógios e Joias > ' || categoria
FROM relogios_id,
(VALUES 
  ('Relógios Masculinos', 1),
  ('Relógios Femininos', 2),
  ('Smartwatches', 3),
  ('Joias', 4),
  ('Bijuterias', 5),
  ('Acessórios', 6),
  ('Outros', 7)
) AS cat(categoria, ordem);

-- MAIS CATEGORIAS
WITH mais_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Mais Categorias'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, mais_id.id, 'Mais Categorias > ' || categoria
FROM mais_id,
(VALUES 
  ('Outras Categorias', 1),
  ('Produtos Diversos', 2),
  ('Itens Especiais', 3),
  ('Colecionáveis', 4),
  ('Importados', 5),
  ('Artesanato', 6),
  ('Personalizados', 7),
  ('Vintage', 8),
  ('Outros', 9)
) AS cat(categoria, ordem);