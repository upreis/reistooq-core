-- 1) Criar tabela global de catálogo de categorias (sem vínculo a organização)
CREATE TABLE IF NOT EXISTS public.categorias_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NULL,
  cor text NULL DEFAULT '#6366f1',
  icone text NULL,
  nivel int NOT NULL, -- 1=Principal, 2=Categoria, 3=Subcategoria
  categoria_principal_id uuid NULL REFERENCES public.categorias_catalogo(id) ON DELETE CASCADE,
  categoria_id uuid NULL REFERENCES public.categorias_catalogo(id) ON DELETE CASCADE,
  categoria_completa text NULL,
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_catcat_nivel ON public.categorias_catalogo(nivel);
CREATE INDEX IF NOT EXISTS idx_catcat_ordem ON public.categorias_catalogo(ordem);
CREATE INDEX IF NOT EXISTS idx_catcat_nome ON public.categorias_catalogo(nome);
CREATE INDEX IF NOT EXISTS idx_catcat_principal ON public.categorias_catalogo(categoria_principal_id);
CREATE INDEX IF NOT EXISTS idx_catcat_categoria ON public.categorias_catalogo(categoria_id);

-- Evitar duplicidades dentro da hierarquia
CREATE UNIQUE INDEX IF NOT EXISTS ux_catcat_unique ON public.categorias_catalogo(nivel, nome, COALESCE(categoria_principal_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(categoria_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 2) Habilitar RLS e políticas: leitura liberada, escrita restrita
ALTER TABLE public.categorias_catalogo ENABLE ROW LEVEL SECURITY;

-- Leitura por qualquer usuário (inclui anônimos) - pode ajustar para auth.uid() IS NOT NULL se desejar
DROP POLICY IF EXISTS catcat_select_all ON public.categorias_catalogo;
CREATE POLICY catcat_select_all ON public.categorias_catalogo
  FOR SELECT USING (true);

-- Bloquear mutações por clientes (somente service_role/funções SECURITY DEFINER)
DROP POLICY IF EXISTS catcat_block_mutations ON public.categorias_catalogo;
CREATE POLICY catcat_block_mutations ON public.categorias_catalogo
  FOR ALL USING (false) WITH CHECK (false);

-- 3) Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_catcat_updated_at ON public.categorias_catalogo;
CREATE TRIGGER trg_catcat_updated_at
BEFORE UPDATE ON public.categorias_catalogo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Substituir a função seed_default_categories para popular a tabela global
DROP FUNCTION IF EXISTS public.seed_default_categories();
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created_l1 int := 0;
  v_created_l2 int := 0;
  v_created_l3 int := 0;
  principal_id uuid;
  category_id uuid;
  cat_completa text;
BEGIN
  -- Função para construir categoria_completa
  
  -- A) CASA, MÓVEIS E DECORAÇÃO
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Casa, Móveis e Decoração' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Casa, Móveis e Decoração', 1, true, 'Casa, Móveis e Decoração')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  -- Decoração
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Decoração' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Decoração', 1, true, principal_id, 'Casa, Móveis e Decoração > Decoração')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  -- Subcategorias de Decoração
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Casa, Móveis e Decoração > Decoração > ' || sub.nome
  FROM (VALUES ('Almofadas'), ('Arranjos e Flores Artificiais'), ('Cestas'), ('Cortinas e Persianas'), ('Espelhos'), ('Quadros e Molduras'), ('Velas e Aromatizadores')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);
  GET DIAGNOSTICS v_created_l3 = ROW_COUNT;
  
  -- Móveis
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Móveis' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Móveis', 2, true, principal_id, 'Casa, Móveis e Decoração > Móveis')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Casa, Móveis e Decoração > Móveis > ' || sub.nome
  FROM (VALUES ('Poltronas e Sofás'), ('Mesas'), ('Cadeiras'), ('Estantes e Prateleiras'), ('Racks e Estantes para TV')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Organização
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Organização' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Organização', 3, true, principal_id, 'Casa, Móveis e Decoração > Organização')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Casa, Móveis e Decoração > Organização > ' || sub.nome
  FROM (VALUES ('Cabides'), ('Caixas Organizadoras'), ('Ganchos'), ('Prateleiras'), ('Cestas e Organizadores')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Iluminação
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Iluminação' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Iluminação', 4, true, principal_id, 'Casa, Móveis e Decoração > Iluminação')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Casa, Móveis e Decoração > Iluminação > ' || sub.nome
  FROM (VALUES ('Luminárias'), ('Abajures'), ('Lâmpadas'), ('Lustres')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Jardim
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Jardim' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Jardim', 5, true, principal_id, 'Casa, Móveis e Decoração > Jardim')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Casa, Móveis e Decoração > Jardim > ' || sub.nome
  FROM (VALUES ('Vasos'), ('Plantas Artificiais'), ('Ferramentas de Jardim'), ('Sementes'), ('Adubos'), ('Regadores')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- B) ELETRÔNICOS, ÁUDIO E VÍDEO
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Eletrônicos, Áudio e Vídeo' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Eletrônicos, Áudio e Vídeo', 2, true, 'Eletrônicos, Áudio e Vídeo')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  -- Smartphones
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Smartphones' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Smartphones', 1, true, principal_id, 'Eletrônicos, Áudio e Vídeo > Smartphones')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Eletrônicos, Áudio e Vídeo > Smartphones > ' || sub.nome
  FROM (VALUES ('iPhone'), ('Samsung Galaxy'), ('Xiaomi'), ('Motorola'), ('LG'), ('OnePlus')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Tablets
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Tablets' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Tablets', 2, true, principal_id, 'Eletrônicos, Áudio e Vídeo > Tablets')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Eletrônicos, Áudio e Vídeo > Tablets > ' || sub.nome
  FROM (VALUES ('iPad'), ('Samsung Tab'), ('Lenovo Tab'), ('Positivo'), ('Multilaser')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Notebooks
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Notebooks' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Notebooks', 3, true, principal_id, 'Eletrônicos, Áudio e Vídeo > Notebooks')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Eletrônicos, Áudio e Vídeo > Notebooks > ' || sub.nome
  FROM (VALUES ('Dell'), ('HP'), ('Lenovo'), ('Asus'), ('Acer'), ('Apple')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- Áudio
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Áudio' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Áudio', 4, true, principal_id, 'Eletrônicos, Áudio e Vídeo > Áudio')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Eletrônicos, Áudio e Vídeo > Áudio > ' || sub.nome
  FROM (VALUES ('Fones de Ouvido'), ('Caixas de Som'), ('Microfones'), ('Amplificadores'), ('Equipamentos de DJ')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- C) BELEZA E CUIDADO PESSOAL
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Beleza e Cuidado Pessoal' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Beleza e Cuidado Pessoal', 3, true, 'Beleza e Cuidado Pessoal')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Barbearia' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Barbearia', 1, true, principal_id, 'Beleza e Cuidado Pessoal > Barbearia')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Beleza e Cuidado Pessoal > Barbearia > ' || sub.nome
  FROM (VALUES ('Navalhas de Barbear'), ('Pentes Alisadores de Barbas'), ('Pincéis de Barba'), ('Produtos Pós Barba')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Cuidados com a Pele' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Cuidados com a Pele', 2, true, principal_id, 'Beleza e Cuidado Pessoal > Cuidados com a Pele')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Beleza e Cuidado Pessoal > Cuidados com a Pele > ' || sub.nome
  FROM (VALUES ('Autobronzeador'), ('Cuidado Facial'), ('Cuidado do Corpo'), ('Proteção Solar')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- D) BEBÊS
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Bebês' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Bebês', 4, true, 'Bebês')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Higiene e Cuidados com o Bebê' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Higiene e Cuidados com o Bebê', 1, true, principal_id, 'Bebês > Higiene e Cuidados com o Bebê')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Bebês > Higiene e Cuidados com o Bebê > ' || sub.nome
  FROM (VALUES ('Escovas e Pentes'), ('Esponjas de Banho'), ('Fraldas'), ('Kits Cuidados para Bebês'), ('Lenços Umedecidos'), ('Sabonetes e Shampoos')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Alimentação e Amamentação' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Alimentação e Amamentação', 2, true, principal_id, 'Bebês > Alimentação e Amamentação')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Bebês > Alimentação e Amamentação > ' || sub.nome
  FROM (VALUES ('Mamadeiras e Chupetas'), ('Papinhas e Leites'), ('Esterilizadores'), ('Babadores')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Brinquedos para Bebês' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Brinquedos para Bebês', 3, true, principal_id, 'Bebês > Brinquedos para Bebês')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Bebês > Brinquedos para Bebês > ' || sub.nome
  FROM (VALUES ('Mordedores'), ('Móbiles'), ('Pelúcias'), ('Sonajeros')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Quarto do Bebê' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Quarto do Bebê', 4, true, principal_id, 'Bebês > Quarto do Bebê')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Bebês > Quarto do Bebê > ' || sub.nome
  FROM (VALUES ('Berços e Cercados'), ('Enxoval e Roupas de Cama'), ('Decoração'), ('Umidificadores')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- E) ARTE, PAPELARIA E ARMARINHO
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Arte, Papelaria e Armarinho' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Arte, Papelaria e Armarinho', 5, true, 'Arte, Papelaria e Armarinho')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Artigos de Armarinho' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Artigos de Armarinho', 1, true, principal_id, 'Arte, Papelaria e Armarinho > Artigos de Armarinho')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Arte, Papelaria e Armarinho > Artigos de Armarinho > ' || sub.nome
  FROM (VALUES ('Flores de Tecido'), ('Franjas'), ('Lantejuelas'), ('Lãs'), ('Linhas e Fios'), ('Tecidos'), ('Aviamentos')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Materiais Escolares' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Materiais Escolares', 2, true, principal_id, 'Arte, Papelaria e Armarinho > Materiais Escolares')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Arte, Papelaria e Armarinho > Materiais Escolares > ' || sub.nome
  FROM (VALUES ('Cadernos e Blocos'), ('Canetas e Lápis'), ('Cola e Fita Adesiva'), ('Mochilas e Estojos'), ('Réguas e Esquadros')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Arte e Trabalhos Manuais' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Arte e Trabalhos Manuais', 3, true, principal_id, 'Arte, Papelaria e Armarinho > Arte e Trabalhos Manuais')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Arte, Papelaria e Armarinho > Arte e Trabalhos Manuais > ' || sub.nome
  FROM (VALUES ('Desenho e Pintura'), ('Massinha e Argila'), ('Papel e Cartolina'), ('Pincéis e Tintas')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- F) ANIMAIS
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Animais' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Animais', 6, true, 'Animais')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Cães' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Cães', 1, true, principal_id, 'Animais > Cães')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Animais > Cães > ' || sub.nome
  FROM (VALUES ('Adestramento'), ('Alimento, Petisco e Suplemento'), ('Cadeiras de Rocha'), ('Camas e Casas'), ('Coleiras e Guias'), ('Higiene e Cuidados'), ('Brinquedos')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Gatos' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Gatos', 2, true, principal_id, 'Animais > Gatos')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Animais > Gatos > ' || sub.nome
  FROM (VALUES ('Alimento e Petisco'), ('Areia Sanitária'), ('Brinquedos'), ('Camas e Casinhas'), ('Higiene e Cuidados')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Peixes' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Peixes', 3, true, principal_id, 'Animais > Peixes')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Animais > Peixes > ' || sub.nome
  FROM (VALUES ('Aquários e Decoração'), ('Alimento para Peixes'), ('Filtros e Bombas'), ('Iluminação')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Aves e Acessórios' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Aves e Acessórios', 4, true, principal_id, 'Animais > Aves e Acessórios')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Animais > Aves e Acessórios > ' || sub.nome
  FROM (VALUES ('Alimento para Aves'), ('Gaiolas e Acessórios'), ('Brinquedos para Aves')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- G) ALIMENTOS E BEBIDAS
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Alimentos e Bebidas' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Alimentos e Bebidas', 7, true, 'Alimentos e Bebidas')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Bebidas' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Bebidas', 1, true, principal_id, 'Alimentos e Bebidas > Bebidas')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Alimentos e Bebidas > Bebidas > ' || sub.nome
  FROM (VALUES ('Bebidas Alcoólicas Mistas'), ('Bebidas Aperitivas'), ('Bebidas Brancas e Licores'), ('Cervejas'), ('Energéticos'), ('Refrigerantes'), ('Sucos'), ('Vinhos')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Comida e Bebida' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Comida e Bebida', 2, true, principal_id, 'Alimentos e Bebidas > Comida e Bebida')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Alimentos e Bebidas > Comida e Bebida > ' || sub.nome
  FROM (VALUES ('Chocolate e Balas'), ('Conservas'), ('Farinhas, Grãos e Cereais'), ('Temperos e Condimentos')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  -- H) ACESSÓRIOS PARA VEÍCULOS
  SELECT id INTO principal_id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Acessórios para Veículos' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Acessórios para Veículos', 8, true, 'Acessórios para Veículos')
    RETURNING id INTO principal_id; v_created_l1 := v_created_l1 + 1;
  END IF;
  
  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Carros e Caminhonetes' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Carros e Caminhonetes', 1, true, principal_id, 'Acessórios para Veículos > Carros e Caminhonetes')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Acessórios para Veículos > Carros e Caminhonetes > ' || sub.nome
  FROM (VALUES ('Acessórios para Interior'), ('Eletroventiladores'), ('Fechaduras e Chaves'), ('Filtros'), ('Freios'), ('Lanternas'), ('Motores'), ('Pneus e Rodas'), ('Sistema de Arrefecimento'), ('Som e Multimídia')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  SELECT id INTO category_id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = 'Motos' AND categoria_principal_id = principal_id LIMIT 1;
  IF category_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
    VALUES (2, 'Motos', 2, true, principal_id, 'Acessórios para Veículos > Motos')
    RETURNING id INTO category_id; v_created_l2 := v_created_l2 + 1;
  END IF;
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  SELECT 3, sub.nome, 1, true, principal_id, category_id, 'Acessórios para Veículos > Motos > ' || sub.nome
  FROM (VALUES ('Capacetes'), ('Escapamentos'), ('Filtros'), ('Pneus e Rodas'), ('Sistemas Elétricos')) AS sub(nome)
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = sub.nome AND categoria_id = category_id);

  RETURN json_build_object('success', true, 'created_level1', v_created_l1, 'created_level2', v_created_l2, 'created_level3', v_created_l3);
END;
$$;

-- 5) Popular o catálogo global (idempotente)
SELECT public.seed_default_categories();