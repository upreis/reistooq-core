-- Inserir todas as categorias hierárquicas extraídas das imagens
-- Usando approach mais seguro sem ON CONFLICT

-- CATEGORIA PRINCIPAL: Beleza e Cuidado Pessoal
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
SELECT 'Beleza e Cuidado Pessoal', 1, get_current_org_id(), true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos 
  WHERE nome = 'Beleza e Cuidado Pessoal' AND nivel = 1 AND organization_id = get_current_org_id()
);

-- Categorias de nível 2 para Beleza e Cuidado Pessoal
WITH beleza_principal AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Beleza e Cuidado Pessoal' AND nivel = 1 AND organization_id = get_current_org_id()
),
categorias_inserir AS (
  SELECT categoria, ROW_NUMBER() OVER () as ordem
  FROM (VALUES 
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
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT ci.categoria, 2, bp.id, get_current_org_id(), true, ci.ordem
FROM beleza_principal bp, categorias_inserir ci
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos cp2 
  WHERE cp2.nome = ci.categoria AND cp2.nivel = 2 AND cp2.organization_id = get_current_org_id()
);

-- CATEGORIA PRINCIPAL: Bebês
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
SELECT 'Bebês', 1, get_current_org_id(), true, 2
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos 
  WHERE nome = 'Bebês' AND nivel = 1 AND organization_id = get_current_org_id()
);

-- Categorias de nível 2 para Bebês
WITH bebes_principal AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Bebês' AND nivel = 1 AND organization_id = get_current_org_id()
),
categorias_inserir AS (
  SELECT categoria, ROW_NUMBER() OVER () as ordem
  FROM (VALUES 
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
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT ci.categoria, 2, bp.id, get_current_org_id(), true, ci.ordem
FROM bebes_principal bp, categorias_inserir ci
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos cp2 
  WHERE cp2.nome = ci.categoria AND cp2.nivel = 2 AND cp2.organization_id = get_current_org_id()
);

-- CATEGORIA PRINCIPAL: Arte, Papelaria e Armarinho
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
SELECT 'Arte, Papelaria e Armarinho', 1, get_current_org_id(), true, 3
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos 
  WHERE nome = 'Arte, Papelaria e Armarinho' AND nivel = 1 AND organization_id = get_current_org_id()
);

-- Categorias de nível 2 para Arte, Papelaria e Armarinho
WITH arte_principal AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Arte, Papelaria e Armarinho' AND nivel = 1 AND organization_id = get_current_org_id()
),
categorias_inserir AS (
  SELECT categoria, ROW_NUMBER() OVER () as ordem
  FROM (VALUES 
    ('Artigos de Armarinho'),
    ('Materiais Escolares'),
    ('Arte e Trabalhos Manuais')
  ) AS categorias(categoria)
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT ci.categoria, 2, ap.id, get_current_org_id(), true, ci.ordem
FROM arte_principal ap, categorias_inserir ci
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos cp2 
  WHERE cp2.nome = ci.categoria AND cp2.nivel = 2 AND cp2.organization_id = get_current_org_id()
);

-- CATEGORIA PRINCIPAL: Animais
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
SELECT 'Animais', 1, get_current_org_id(), true, 4
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos 
  WHERE nome = 'Animais' AND nivel = 1 AND organization_id = get_current_org_id()
);

-- Categorias de nível 2 para Animais
WITH animais_principal AS (
  SELECT id FROM public.categorias_produtos 
  WHERE nome = 'Animais' AND nivel = 1 AND organization_id = get_current_org_id()
),
categorias_inserir AS (
  SELECT categoria, ROW_NUMBER() OVER () as ordem
  FROM (VALUES 
    ('Cães'),
    ('Gatos'),
    ('Peixes'),
    ('Roedores'),
    ('Anfíbios e Répteis'),
    ('Aves e Acessórios'),
    ('Cavalos'),
    ('Coelhos')
  ) AS categorias(categoria)
)
INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem) 
SELECT ci.categoria, 2, ap.id, get_current_org_id(), true, ci.ordem
FROM animais_principal ap, categorias_inserir ci
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos cp2 
  WHERE cp2.nome = ci.categoria AND cp2.nivel = 2 AND cp2.organization_id = get_current_org_id()
);

-- CATEGORIA PRINCIPAL: Antiguidades e Coleções
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
SELECT 'Antiguidades e Coleções', 1, get_current_org_id(), true, 5
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos 
  WHERE nome = 'Antiguidades e Coleções' AND nivel = 1 AND organization_id = get_current_org_id()
);

-- CATEGORIA PRINCIPAL: Agro
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
SELECT 'Agro', 1, get_current_org_id(), true, 6
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos 
  WHERE nome = 'Agro' AND nivel = 1 AND organization_id = get_current_org_id()
);

-- CATEGORIA PRINCIPAL: Alimentos e Bebidas
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
SELECT 'Alimentos e Bebidas', 1, get_current_org_id(), true, 7
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos 
  WHERE nome = 'Alimentos e Bebidas' AND nivel = 1 AND organization_id = get_current_org_id()
);

-- CATEGORIA PRINCIPAL: Acessórios para Veículos
INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
SELECT 'Acessórios para Veículos', 1, get_current_org_id(), true, 8
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produtos 
  WHERE nome = 'Acessórios para Veículos' AND nivel = 1 AND organization_id = get_current_org_id()
);