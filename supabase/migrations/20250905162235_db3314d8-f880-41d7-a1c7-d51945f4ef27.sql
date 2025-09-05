-- Inserir subcategorias de nível 3 diretamente
-- Seguindo o mesmo padrão que funcionou para níveis 1 e 2

-- A) ACESSÓRIOS PARA VEÍCULOS > Carros e Caminhonetes
WITH principal AS (
  SELECT id FROM categorias_catalogo WHERE nivel = 1 AND nome = 'Acessórios para Veículos' LIMIT 1
), categoria AS (
  SELECT c.id FROM categorias_catalogo c, principal p
  WHERE c.nivel = 2 AND c.nome = 'Carros e Caminhonetes' AND c.categoria_principal_id = p.id
  LIMIT 1
)
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, p.id, c.id, 'Acessórios para Veículos > Carros e Caminhonetes > ' || sub.nome
FROM (VALUES 
  ('Acessórios para Interior', 1), ('Alarmes e Trava Elétricas', 2), ('Ar-condicionado Automotivo', 3),
  ('Baterias Automotivas', 4), ('Buzinas', 5), ('Câmbio', 6), ('Capas para Carros', 7),
  ('Cromados e Apliques', 8), ('Direção', 9), ('Distúrbios Elétricos', 10),
  ('Eletroventiladores', 11), ('Embreagem', 12), ('Escapamentos', 13), ('Espelhos', 14),
  ('Fechaduras e Chaves', 15), ('Filtros', 16), ('Freios', 17), ('GPS Automotivo', 18),
  ('Instrumentos', 19), ('Kits Automotivos', 20), ('Lanternas', 21), ('Limpadores de Para-brisa', 22),
  ('Luzes', 23), ('Motores', 24), ('Óleos e Fluidos', 25), ('Para-choques', 26),
  ('Para-lamas', 27), ('Peças de Carroceria', 28), ('Pneus e Rodas', 29), ('Radiadores', 30),
  ('Retrovisores', 31), ('Sistema de Arrefecimento', 32), ('Sistema de Ignição', 33), 
  ('Sistema Elétrico', 34), ('Som e Multimídia', 35), ('Suspensão', 36), ('Tapetes', 37),
  ('Turbo e Compressores', 38), ('Vidros', 39), ('Outros', 40)
) AS sub(nome, ordem), principal p, categoria c
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_catalogo 
  WHERE nivel = 3 AND nome = sub.nome AND categoria_id = c.id
);

-- B) ACESSÓRIOS PARA VEÍCULOS > Motos
WITH principal AS (
  SELECT id FROM categorias_catalogo WHERE nivel = 1 AND nome = 'Acessórios para Veículos' LIMIT 1
), categoria AS (
  SELECT c.id FROM categorias_catalogo c, principal p
  WHERE c.nivel = 2 AND c.nome = 'Motos' AND c.categoria_principal_id = p.id
  LIMIT 1
)
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, p.id, c.id, 'Acessórios para Veículos > Motos > ' || sub.nome
FROM (VALUES 
  ('Acessórios', 1), ('Alarmes para Motos', 2), ('Capacetes', 3), ('Carburadores', 4),
  ('Carenagens', 5), ('Chassi e Suspensão', 6), ('Cilindros', 7), ('Escapamentos', 8),
  ('Espelhos', 9), ('Filtros', 10), ('Freios', 11), ('Guidões', 12),
  ('Instrumentos', 13), ('Kits', 14), ('Lanternas', 15), ('Motores', 16),
  ('Óleos e Fluidos', 17), ('Para-lamas', 18), ('Peças de Motor', 19), ('Pneus e Rodas', 20),
  ('Sistemas Elétricos', 21), ('Tanques de Combustível', 22), ('Transmissão', 23), ('Outros', 24)
) AS sub(nome, ordem), principal p, categoria c
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_catalogo 
  WHERE nivel = 3 AND nome = sub.nome AND categoria_id = c.id
);

-- C) CASA, MÓVEIS E DECORAÇÃO > Decoração
WITH principal AS (
  SELECT id FROM categorias_catalogo WHERE nivel = 1 AND nome = 'Casa, Móveis e Decoração' LIMIT 1
), categoria AS (
  SELECT c.id FROM categorias_catalogo c, principal p
  WHERE c.nivel = 2 AND c.nome = 'Decoração' AND c.categoria_principal_id = p.id
  LIMIT 1
)
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, p.id, c.id, 'Casa, Móveis e Decoração > Decoração > ' || sub.nome
FROM (VALUES 
  ('Almofadas', 1), ('Arranjos e Flores Artificiais', 2), ('Artigos Religiosos', 3), ('Cestas', 4),
  ('Cortinas e Persianas', 5), ('Espelhos', 6), ('Esculturas', 7), ('Estátuas', 8),
  ('Fontes Decorativas', 9), ('Incensos e Defumadores', 10), ('Objetos Decorativos', 11), 
  ('Pinturas', 12), ('Porta-retratos', 13), ('Quadros e Molduras', 14), ('Relógios de Parede', 15),
  ('Tapetes', 16), ('Vasos Decorativos', 17), ('Velas e Aromatizadores', 18), ('Outros', 19)
) AS sub(nome, ordem), principal p, categoria c
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_catalogo 
  WHERE nivel = 3 AND nome = sub.nome AND categoria_id = c.id
);

-- D) CASA, MÓVEIS E DECORAÇÃO > Móveis
WITH principal AS (
  SELECT id FROM categorias_catalogo WHERE nivel = 1 AND nome = 'Casa, Móveis e Decoração' LIMIT 1
), categoria AS (
  SELECT c.id FROM categorias_catalogo c, principal p
  WHERE c.nivel = 2 AND c.nome = 'Móveis' AND c.categoria_principal_id = p.id
  LIMIT 1
)
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, p.id, c.id, 'Casa, Móveis e Decoração > Móveis > ' || sub.nome
FROM (VALUES 
  ('Bancos e Banquetas', 1), ('Camas', 2), ('Cadeiras', 3), ('Cômodas', 4),
  ('Escrivaninhas', 5), ('Estantes e Prateleiras', 6), ('Guarda-roupas', 7), ('Mesas', 8),
  ('Móveis para Banheiro', 9), ('Móveis para Cozinha', 10), ('Poltrona Relaxante', 11), 
  ('Poltronas e Sofás', 12), ('Racks e Estantes para TV', 13), ('Sapateiras', 14), ('Outros', 15)
) AS sub(nome, ordem), principal p, categoria c
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_catalogo 
  WHERE nivel = 3 AND nome = sub.nome AND categoria_id = c.id
);

-- E) ELETRÔNICOS, ÁUDIO E VÍDEO > Smartphones  
WITH principal AS (
  SELECT id FROM categorias_catalogo WHERE nivel = 1 AND nome = 'Eletrônicos, Áudio e Vídeo' LIMIT 1
), categoria AS (
  SELECT c.id FROM categorias_catalogo c, principal p
  WHERE c.nivel = 2 AND c.nome = 'Smartphones' AND c.categoria_principal_id = p.id
  LIMIT 1
)
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, p.id, c.id, 'Eletrônicos, Áudio e Vídeo > Smartphones > ' || sub.nome
FROM (VALUES 
  ('iPhone', 1), ('Samsung Galaxy', 2), ('Xiaomi', 3), ('Motorola', 4), ('LG', 5), ('OnePlus', 6),
  ('Huawei', 7), ('Google Pixel', 8), ('Nokia', 9), ('Sony Xperia', 10), ('Asus', 11), 
  ('Realme', 12), ('Oppo', 13), ('Vivo', 14), ('Honor', 15), ('Outros', 16)
) AS sub(nome, ordem), principal p, categoria c
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_catalogo 
  WHERE nivel = 3 AND nome = sub.nome AND categoria_id = c.id
);