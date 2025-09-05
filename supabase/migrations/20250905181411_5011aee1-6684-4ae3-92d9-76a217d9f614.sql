-- Excluir TODAS as categorias existentes e implementar estrutura EXATA do Mercado Livre
DELETE FROM public.categorias_catalogo;

-- Inserir TODAS as 35 categorias principais do Mercado Livre (Nível 1)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_completa) VALUES
(1, 'Acessórios para Veículos', 1, true, 'Acessórios para Veículos'),
(1, 'Agro', 2, true, 'Agro'),
(1, 'Alimentos e Bebidas', 3, true, 'Alimentos e Bebidas'),
(1, 'Pet Shop', 4, true, 'Pet Shop'),
(1, 'Antiguidades e Coleções', 5, true, 'Antiguidades e Coleções'),
(1, 'Arte, Papelaria e Armarinho', 6, true, 'Arte, Papelaria e Armarinho'),
(1, 'Bebês', 7, true, 'Bebês'),
(1, 'Beleza e Cuidado Pessoal', 8, true, 'Beleza e Cuidado Pessoal'),
(1, 'Brinquedos e Hobbies', 9, true, 'Brinquedos e Hobbies'),
(1, 'Calçados, Roupas e Bolsas', 10, true, 'Calçados, Roupas e Bolsas'),
(1, 'Câmeras e Acessórios', 11, true, 'Câmeras e Acessórios'),
(1, 'Carros, Motos e Outros', 12, true, 'Carros, Motos e Outros'),
(1, 'Casa, Móveis e Decoração', 13, true, 'Casa, Móveis e Decoração'),
(1, 'Celulares e Telefones', 14, true, 'Celulares e Telefones'),
(1, 'Consoles e Video Games', 15, true, 'Consoles e Video Games'),
(1, 'Construção', 16, true, 'Construção'),
(1, 'Eletrodomésticos', 17, true, 'Eletrodomésticos'),
(1, 'Eletrônicos, Áudio e Vídeo', 18, true, 'Eletrônicos, Áudio e Vídeo'),
(1, 'Esportes e Fitness', 19, true, 'Esportes e Fitness'),
(1, 'Ferramentas', 20, true, 'Ferramentas'),
(1, 'Festas e Lembrancinhas', 21, true, 'Festas e Lembrancinhas'),
(1, 'Imóveis', 22, true, 'Imóveis'),
(1, 'Indústria e Comércio', 23, true, 'Indústria e Comércio'),
(1, 'Informática', 24, true, 'Informática'),
(1, 'Instrumentos Musicais', 25, true, 'Instrumentos Musicais'),
(1, 'Joias e Relógios', 26, true, 'Joias e Relógios'),
(1, 'Livros, Revistas e Comics', 27, true, 'Livros, Revistas e Comics'),
(1, 'Música, Filmes e Seriados', 28, true, 'Música, Filmes e Seriados'),
(1, 'Saúde', 29, true, 'Saúde'),
(1, 'Serviços', 30, true, 'Serviços'),
(1, 'Souvenirs, Lembrancinhas e Artesanato', 31, true, 'Souvenirs, Lembrancinhas e Artesanato'),
(1, 'Tênis', 32, true, 'Tênis'),
(1, 'Relógios e Joias', 33, true, 'Relógios e Joias'),
(1, 'Games', 34, true, 'Games'),
(1, 'Mais Categorias', 35, true, 'Mais Categorias');

-- Inserir categorias Nível 2 para AGRO (19 categorias exatas do ML)
WITH agro_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Agro'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, agro_id.id, 'Agro > ' || categoria
FROM agro_id,
(VALUES 
  ('Agricultura de Precisão', 1),
  ('Animais', 2),
  ('Apicultura', 3),
  ('Armezenamento', 4),
  ('Energia Renovável', 5),
  ('Ferramentas de Trabalho', 6),
  ('Fertilizantes', 7),
  ('Infra-estrutura Rural', 8),
  ('Insumos Agrícolas', 9),
  ('Insumos Gadeiros', 10),
  ('Irrigação', 11),
  ('Lubrificantes e Fluidos', 12),
  ('Maquinaria Agrícola', 13),
  ('Máquinas Forrageiras', 14),
  ('Outros', 15),
  ('Peças Maquinaria Agrícola', 16),
  ('Produçao Animal', 17),
  ('Proteção de Culturas', 18),
  ('Sementes Agrícolas', 19)
) AS cat(categoria, ordem);

-- Inserir categorias Nível 2 para ACESSÓRIOS PARA VEÍCULOS (21 categorias)
WITH veiculos_id AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Acessórios para Veículos'
)
INSERT INTO public.categorias_catalogo (nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, categoria, ordem, true, veiculos_id.id, 'Acessórios para Veículos > ' || categoria
FROM veiculos_id,
(VALUES 
  ('Aces. de Carros e Caminhonetes', 1),
  ('Aces. de Motos e Quadriciclos', 2),
  ('Acessórios Náuticos', 3),
  ('Acessórios de Linha Pesada', 4),
  ('Ferramentas para Veículos', 5),
  ('GNV', 6),
  ('Limpeza Automotiva', 7),
  ('Lubrificantes e Fluidos', 8),
  ('Motos', 9),
  ('Navegadores GPS para Vehículos', 10),
  ('Outros', 11),
  ('Performance', 12),
  ('Peças Náuticas', 13),
  ('Peças de Carros e Caminhonetes', 14),
  ('Peças de Linha Pesada', 15),
  ('Peças de Motos e Quadriciclos', 16),
  ('Pneus e Acessórios', 17),
  ('Rodas', 18),
  ('Segurança Veicular', 19),
  ('Som Automotivo', 20),
  ('Tuning', 21)
) AS cat(categoria, ordem);