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
  principal text;
  cat text;
  sub text;
  principal_id uuid;
  category_id uuid;

  -- helper para montar categoria_completa
  FUNCTION full_path(_nivel int, _nome text, _principal_id uuid, _categoria_id uuid) RETURNS text AS $$
  DECLARE p text; c text; pr text; cat2 text; BEGIN
    IF _nivel = 1 THEN RETURN _nome; END IF;
    IF _nivel = 2 THEN
      SELECT nome INTO pr FROM public.categorias_catalogo WHERE id = _principal_id;
      RETURN pr || ' > ' || _nome;
    END IF;
    IF _nivel = 3 THEN
      SELECT nome INTO cat2 FROM public.categorias_catalogo WHERE id = _categoria_id;
      SELECT nome INTO pr FROM public.categorias_catalogo WHERE id = _principal_id;
      RETURN pr || ' > ' || cat2 || ' > ' || _nome;
    END IF;
    RETURN _nome;
  END; $$ LANGUAGE plpgsql;

  PROCEDURE ensure_principal(_nome text, _ordem int, OUT _id uuid) AS $$
  BEGIN
    SELECT id INTO _id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = _nome LIMIT 1;
    IF _id IS NULL THEN
      INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
      VALUES (1, _nome, _ordem, true, _nome)
      RETURNING id INTO _id; v_created_l1 := v_created_l1 + 1;
    END IF;
  END; $$ LANGUAGE plpgsql;

  PROCEDURE ensure_categoria(_principal_id uuid, _nome text, _ordem int, OUT _id uuid) AS $$
  DECLARE _full text; BEGIN
    SELECT id INTO _id FROM public.categorias_catalogo WHERE nivel = 2 AND nome = _nome AND categoria_principal_id = _principal_id LIMIT 1;
    IF _id IS NULL THEN
      _full := full_path(2, _nome, _principal_id, NULL);
      INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
      VALUES (2, _nome, _ordem, true, _principal_id, _full)
      RETURNING id INTO _id; v_created_l2 := v_created_l2 + 1;
    END IF;
  END; $$ LANGUAGE plpgsql;

  PROCEDURE ensure_subcategoria(_principal_id uuid, _categoria_id uuid, _nome text, _ordem int) AS $$
  DECLARE _id3 uuid; _full text; BEGIN
    SELECT id INTO _id3 FROM public.categorias_catalogo WHERE nivel = 3 AND nome = _nome AND categoria_id = _categoria_id LIMIT 1;
    IF _id3 IS NULL THEN
      _full := full_path(3, _nome, _principal_id, _categoria_id);
      INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
      VALUES (3, _nome, _ordem, true, _principal_id, _categoria_id, _full);
      v_created_l3 := v_created_l3 + 1;
    END IF;
  END; $$ LANGUAGE plpgsql;
BEGIN
  -- A) CASA, MÓVEIS E DECORAÇÃO
  CALL ensure_principal('Casa, Móveis e Decoração', 1, principal_id);
  -- Decoração
  CALL ensure_categoria(principal_id, 'Decoração', 1, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Almofadas'), ('Arranjos e Flores Artificiais'), ('Cestas'), ('Cortinas e Persianas'),
    ('Espelhos'), ('Quadros e Molduras'), ('Velas e Aromatizadores')
  ) v(s);
  -- Móveis
  CALL ensure_categoria(principal_id, 'Móveis', 2, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Poltronas e Sofás'), ('Mesas'), ('Cadeiras'), ('Estantes e Prateleiras'), ('Racks e Estantes para TV')
  ) v(s);
  -- Organização
  CALL ensure_categoria(principal_id, 'Organização', 3, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Cabides'), ('Caixas Organizadoras'), ('Ganchos'), ('Prateleiras'), ('Cestas e Organizadores')
  ) v(s);
  -- Iluminação
  CALL ensure_categoria(principal_id, 'Iluminação', 4, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Luminárias'), ('Abajures'), ('Lâmpadas'), ('Lustres')
  ) v(s);
  -- Jardim
  CALL ensure_categoria(principal_id, 'Jardim', 5, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Vasos'), ('Plantas Artificiais'), ('Ferramentas de Jardim'), ('Sementes'), ('Adubos'), ('Regadores')
  ) v(s);

  -- B) ELETRÔNICOS, ÁUDIO E VÍDEO
  CALL ensure_principal('Eletrônicos, Áudio e Vídeo', 2, principal_id);
  -- Smartphones
  CALL ensure_categoria(principal_id, 'Smartphones', 1, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('iPhone'), ('Samsung Galaxy'), ('Xiaomi'), ('Motorola'), ('LG'), ('OnePlus')
  ) v(s);
  -- Tablets
  CALL ensure_categoria(principal_id, 'Tablets', 2, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('iPad'), ('Samsung Tab'), ('Lenovo Tab'), ('Positivo'), ('Multilaser')
  ) v(s);
  -- Notebooks
  CALL ensure_categoria(principal_id, 'Notebooks', 3, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Dell'), ('HP'), ('Lenovo'), ('Asus'), ('Acer'), ('Apple')
  ) v(s);
  -- Áudio
  CALL ensure_categoria(principal_id, 'Áudio', 4, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Fones de Ouvido'), ('Caixas de Som'), ('Microfones'), ('Amplificadores'), ('Equipamentos de DJ')
  ) v(s);

  -- C) BELEZA E CUIDADO PESSOAL
  CALL ensure_principal('Beleza e Cuidado Pessoal', 3, principal_id);
  CALL ensure_categoria(principal_id, 'Barbearia', 1, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Navalhas de Barbear'), ('Pentes Alisadores de Barbas'), ('Pincéis de Barba'), ('Produtos Pós Barba')
  ) v(s);
  CALL ensure_categoria(principal_id, 'Cuidados com a Pele', 2, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Autobronzeador'), ('Cuidado Facial'), ('Cuidado do Corpo'), ('Proteção Solar')
  ) v(s);

  -- D) BEBÊS
  CALL ensure_principal('Bebês', 4, principal_id);
  CALL ensure_categoria(principal_id, 'Higiene e Cuidados com o Bebê', 1, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Escovas e Pentes'), ('Esponjas de Banho'), ('Fraldas'), ('Kits Cuidados para Bebês'), ('Lenços Umedecidos'), ('Sabonetes e Shampoos')
  ) v(s);
  CALL ensure_categoria(principal_id, 'Alimentação e Amamentação', 2, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Mamadeiras e Chupetas'), ('Papinhas e Leites'), ('Esterilizadores'), ('Babadores')
  ) v(s);
  CALL ensure_categoria(principal_id, 'Brinquedos para Bebês', 3, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Mordedores'), ('Móbiles'), ('Pelúcias'), ('Sonajeros')
  ) v(s);
  CALL ensure_categoria(principal_id, 'Quarto do Bebê', 4, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Berços e Cercados'), ('Enxoval e Roupas de Cama'), ('Decoração'), ('Umidificadores')
  ) v(s);

  -- E) ARTE, PAPELARIA E ARMARINHO
  CALL ensure_principal('Arte, Papelaria e Armarinho', 5, principal_id);
  CALL ensure_categoria(principal_id, 'Artigos de Armarinho', 1, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Flores de Tecido'), ('Franjas'), ('Lantejuelas'), ('Lãs'), ('Linhas e Fios'), ('Tecidos'), ('Aviamentos')
  ) v(s);
  CALL ensure_categoria(principal_id, 'Materiais Escolares', 2, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Cadernos e Blocos'), ('Canetas e Lápis'), ('Cola e Fita Adesiva'), ('Mochilas e Estojos'), ('Réguas e Esquadros')
  ) v(s);
  CALL ensure_categoria(principal_id, 'Arte e Trabalhos Manuais', 3, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Desenho e Pintura'), ('Massinha e Argila'), ('Papel e Cartolina'), ('Pincéis e Tintas')
  ) v(s);

  -- F) ANIMAIS
  CALL ensure_principal('Animais', 6, principal_id);
  CALL ensure_categoria(principal_id, 'Cães', 1, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Adestramento'), ('Alimento, Petisco e Suplemento'), ('Cadeiras de Rocha'), ('Camas e Casas'), ('Coleiras e Guias'), ('Higiene e Cuidados'), ('Brinquedos')
  ) v(s);
  CALL ensure_categoria(principal_id, 'Gatos', 2, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Alimento e Petisco'), ('Areia Sanitária'), ('Brinquedos'), ('Camas e Casinhas'), ('Higiene e Cuidados')
  ) v(s);
  CALL ensure_categoria(principal_id, 'Peixes', 3, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Aquários e Decoração'), ('Alimento para Peixes'), ('Filtros e Bombas'), ('Iluminação')
  ) v(s);
  CALL ensure_categoria(principal_id, 'Aves e Acessórios', 4, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Alimento para Aves'), ('Gaiolas e Acessórios'), ('Brinquedos para Aves')
  ) v(s);

  -- G) ALIMENTOS E BEBIDAS
  CALL ensure_principal('Alimentos e Bebidas', 7, principal_id);
  CALL ensure_categoria(principal_id, 'Bebidas', 1, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Bebidas Alcoólicas Mistas'), ('Bebidas Aperitivas'), ('Bebidas Brancas e Licores'), ('Cervejas'), ('Energéticos'), ('Refrigerantes'), ('Sucos'), ('Vinhos')
  ) v(s);
  CALL ensure_categoria(principal_id, 'Comida e Bebida', 2, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Chocolate e Balas'), ('Conservas'), ('Farinhas, Grãos e Cereais'), ('Temperos e Condimentos')
  ) v(s);

  -- H) ACESSÓRIOS PARA VEÍCULOS
  CALL ensure_principal('Acessórios para Veículos', 8, principal_id);
  CALL ensure_categoria(principal_id, 'Carros e Caminhonetes', 1, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Acessórios para Interior'), ('Eletroventiladores'), ('Fechaduras e Chaves'), ('Filtros'), ('Freios'), ('Lanternas'), ('Motores'), ('Pneus e Rodas'), ('Sistema de Arrefecimento'), ('Som e Multimídia')
  ) v(s);
  CALL ensure_categoria(principal_id, 'Motos', 2, category_id);
  PERFORM ensure_subcategoria(principal_id, category_id, s, 1) FROM (VALUES
    ('Capacetes'), ('Escapamentos'), ('Filtros'), ('Pneus e Rodas'), ('Sistemas Elétricos')
  ) v(s);

  RETURN json_build_object('success', true, 'created_level1', v_created_l1, 'created_level2', v_created_l2, 'created_level3', v_created_l3);
END;
$$;

-- 5) Popular o catálogo global (idempotente)
SELECT public.seed_default_categories();