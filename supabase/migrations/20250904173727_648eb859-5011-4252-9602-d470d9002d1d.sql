-- Inserir todas as categorias hierárquicas extraídas das imagens

-- CATEGORIA PRINCIPAL: Beleza e Cuidado Pessoal
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
VALUES ('Beleza e Cuidado Pessoal', 1, get_current_org_id(), true, 1)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- Categorias de nível 2 para Beleza e Cuidado Pessoal
WITH beleza_principal AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Beleza e Cuidado Pessoal' AND nivel = 1 AND organization_id = get_current_org_id()
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT categoria, 2, beleza_principal.id, get_current_org_id(), true, ROW_NUMBER() OVER ()
FROM beleza_principal, (VALUES 
  ('Barbearia'),
  ('Cuidados com a Pele'),
  ('Cuidados com o Cabelo'),
  ('Depilação'),
  ('Farmácia'),
  ('Higiene Pessoal'),
  ('Manicure e Pedicure'),
  ('Maquiagem'),
  ('Artefatos para Cabelo'),
  ('Artigos para Cabeleireiros')
) AS categorias(categoria)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- Subcategorias para Barbearia
WITH barbearia_cat AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Barbearia' AND nivel = 2 AND organization_id = get_current_org_id()
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_id, organization_id, ativo, ordem) 
SELECT subcategoria, 3, barbearia_cat.id, get_current_org_id(), true, ROW_NUMBER() OVER ()
FROM barbearia_cat, (VALUES 
  ('Navalhas de Barbear'),
  ('Pentes Alisadores de Barbas'),
  ('Pincéis de Barba'),
  ('Produtos Pós Barba'),
  ('Barbeadores'),
  ('Balms, Gel e Tônicos'),
  ('Capas para Corte'),
  ('Cargas para Barbeadores'),
  ('Escovas Alisadoras de Barba'),
  ('Espumas de Barbear'),
  ('Kits para Barba'),
  ('Lâminas de Barbear'),
  ('Navalhas de Barbear')
) AS subcats(subcategoria)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- Subcategorias para Cuidados com a Pele
WITH cuidados_pele AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Cuidados com a Pele' AND nivel = 2 AND organization_id = get_current_org_id()
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_id, organization_id, ativo, ordem) 
SELECT subcategoria, 3, cuidados_pele.id, get_current_org_id(), true, ROW_NUMBER() OVER ()
FROM cuidados_pele, (VALUES 
  ('Autobronzeador'),
  ('Cuidado Facial'),
  ('Cuidado do Corpo'),
  ('Kits de Cuidado com a Pele'),
  ('Limpeza Facial'),
  ('Máscaras Faciais'),
  ('Protetores Labiais'),
  ('Proteção Solar'),
  ('Pulseiras Repelentes'),
  ('Repelentes'),
  ('Coloração')
) AS subcats(subcategoria)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- CATEGORIA PRINCIPAL: Bebês
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
VALUES ('Bebês', 1, get_current_org_id(), true, 2)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- Categorias de nível 2 para Bebês
WITH bebes_principal AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Bebês' AND nivel = 1 AND organization_id = get_current_org_id()
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT categoria, 2, bebes_principal.id, get_current_org_id(), true, ROW_NUMBER() OVER ()
FROM bebes_principal, (VALUES 
  ('Higiene e Cuidados com o Bebê'),
  ('Maternidade'),
  ('Passeio do Bebê'),
  ('Quarto do Bebê'),
  ('Roupas de Bebê'),
  ('Saúde do Bebê'),
  ('Segurança para Bebê'),
  ('Alimentação e Amamentação'),
  ('Alimentos para Bebês'),
  ('Andadores e Mini Veículos'),
  ('Banho do Bebê'),
  ('Brinquedos para Bebês'),
  ('Chupetas e Mordedores')
) AS categorias(categoria)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- CATEGORIA PRINCIPAL: Arte, Papelaria e Armarinho
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
VALUES ('Arte, Papelaria e Armarinho', 1, get_current_org_id(), true, 3)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- Categorias de nível 2 para Arte, Papelaria e Armarinho
WITH arte_principal AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Arte, Papelaria e Armarinho' AND nivel = 1 AND organization_id = get_current_org_id()
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT categoria, 2, arte_principal.id, get_current_org_id(), true, ROW_NUMBER() OVER ()
FROM arte_principal, (VALUES 
  ('Artigos de Armarinho'),
  ('Materiais Escolares'),
  ('Arte e Trabalhos Manuais')
) AS categorias(categoria)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- CATEGORIA PRINCIPAL: Animais
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
VALUES ('Animais', 1, get_current_org_id(), true, 4)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- Categorias de nível 2 para Animais
WITH animais_principal AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Animais' AND nivel = 1 AND organization_id = get_current_org_id()
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT categoria, 2, animais_principal.id, get_current_org_id(), true, ROW_NUMBER() OVER ()
FROM animais_principal, (VALUES 
  ('Cães'),
  ('Gatos'),
  ('Peixes'),
  ('Roedores'),
  ('Anfíbios e Répteis'),
  ('Aves e Acessórios'),
  ('Cavalos'),
  ('Coelhos')
) AS categorias(categoria)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- CATEGORIA PRINCIPAL: Antiguidades e Coleções
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
VALUES ('Antiguidades e Coleções', 1, get_current_org_id(), true, 5)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- Categorias de nível 2 para Antiguidades e Coleções
WITH antiguidades_principal AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Antiguidades e Coleções' AND nivel = 1 AND organization_id = get_current_org_id()
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT categoria, 2, antiguidades_principal.id, get_current_org_id(), true, ROW_NUMBER() OVER ()
FROM antiguidades_principal, (VALUES 
  ('Antiguidades'),
  ('Cédulas e Moedas'),
  ('Filatelia'),
  ('Militaria e Afins')
) AS categorias(categoria)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- CATEGORIA PRINCIPAL: Agro
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
VALUES ('Agro', 1, get_current_org_id(), true, 6)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- Categorias de nível 2 para Agro
WITH agro_principal AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Agro' AND nivel = 1 AND organization_id = get_current_org_id()
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT categoria, 2, agro_principal.id, get_current_org_id(), true, ROW_NUMBER() OVER ()
FROM agro_principal, (VALUES 
  ('Maquinaria Agrícola'),
  ('Máquinas Forrageiras'),
  ('Produção Animal'),
  ('Proteção de Cultivos'),
  ('Agricultura de Precisão'),
  ('Apicultura'),
  ('Armazenamento'),
  ('Energia Renovável'),
  ('Ferramentas de Trabalho'),
  ('Infra-estrutura Rural'),
  ('Insumos Agrícolas'),
  ('Insumos Gadeiros'),
  ('Irrigação'),
  ('Maquinaria Agrícola')
) AS categorias(categoria)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- CATEGORIA PRINCIPAL: Alimentos e Bebidas
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
VALUES ('Alimentos e Bebidas', 1, get_current_org_id(), true, 7)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- Categorias de nível 2 para Alimentos e Bebidas
WITH alimentos_principal AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Alimentos e Bebidas' AND nivel = 1 AND organization_id = get_current_org_id()
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT categoria, 2, alimentos_principal.id, get_current_org_id(), true, ROW_NUMBER() OVER ()
FROM alimentos_principal, (VALUES 
  ('Bebidas'),
  ('Comida Preparada'),
  ('Congelados'),
  ('Frescos'),
  ('Mercearia')
) AS categorias(categoria)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- CATEGORIA PRINCIPAL: Acessórios para Veículos
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
VALUES ('Acessórios para Veículos', 1, get_current_org_id(), true, 8)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;

-- Categorias de nível 2 para Acessórios para Veículos
WITH acessorios_veiculos AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Acessórios para Veículos' AND nivel = 1 AND organization_id = get_current_org_id()
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT categoria, 2, acessorios_veiculos.id, get_current_org_id(), true, ROW_NUMBER() OVER ()
FROM acessorios_veiculos, (VALUES 
  ('Aces. de Carros e Caminhonetes'),
  ('Aces. de Motos e Quadriciclos'),
  ('Acessórios Náuticos'),
  ('Acessórios de Linha Pesada'),
  ('Ferramentas para Veículos'),
  ('GNV'),
  ('Limpeza Automotiva'),
  ('Lubrificantes e Fluidos'),
  ('Navegadores GPS para Veículos'),
  ('Outros'),
  ('Performance'),
  ('Peças Náuticas'),
  ('Peças de Carros e Caminhonetes'),
  ('Peças de Motos e Quadriciclos'),
  ('Pneus e Acessórios'),
  ('Rodas'),
  ('Segurança Veicular'),
  ('Som Automotivo'),
  ('Tuning')
) AS categorias(categoria)
ON CONFLICT (nome, organization_id, nivel) DO NOTHING;