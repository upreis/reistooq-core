-- Primeira, vamos analisar os dados atuais
DO $$
DECLARE
  total_l3 integer;
BEGIN
  SELECT COUNT(*) INTO total_l3 FROM public.categorias_catalogo WHERE nivel = 3;
  RAISE NOTICE 'Total atual de categorias nível 3: %', total_l3;
END;
$$;

-- Agora vamos inserir TODAS as subcategorias de nível 3 baseadas nos dados das imagens
-- Baseado nas imagens, vou criar todas as subcategorias organizadas por categoria principal

-- ACESSÓRIOS PARA VEÍCULOS > CARROS E CAMINHONETES (mais subcategorias)
WITH nivel2_carros AS (
  SELECT id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Carros e Caminhonetes' 
  AND categoria_principal_id = (SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Acessórios para Veículos')
)
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, 
  (SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Acessórios para Veículos'),
  nivel2_carros.id,
  'Acessórios para Veículos > Carros e Caminhonetes > ' || sub.nome
FROM nivel2_carros,
(VALUES 
  ('Acessórios Externos', 1), ('Acessórios Internos', 2), ('Adesivos', 3), ('Alarmes e Travas', 4),
  ('Amortecedores', 5), ('Antenas', 6), ('Ar Condicionado', 7), ('Bancos e Assentos', 8),
  ('Baterias', 9), ('Borrachas e Vedações', 10), ('Buzinas', 11), ('Cabos', 12),
  ('Caixas de Som', 13), ('Capas Protetoras', 14), ('Carregadores', 15), ('CD Players', 16),
  ('Centrais Multimídia', 17), ('Chaves Canivete', 18), ('Cintos de Segurança', 19), ('Correias', 20),
  ('Desembaçador', 21), ('DVD Players', 22), ('Espelhos Retrovisores', 23), ('Estofamento', 24),
  ('Faróis', 25), ('Filtros de Ar', 26), ('Filtros de Combustível', 27), ('Filtros de Óleo', 28),
  ('Fitas Isolantes', 29), ('Fusíveis', 30), ('GPS', 31), ('Interruptores', 32),
  ('Kits de Reparo', 33), ('Lâmpadas', 34), ('Lanternas', 35), ('Limpa Para-brisas', 36),
  ('Luzes de Emergência', 37), ('Mangueiras', 38), ('Molas', 39), ('Parafusos', 40),
  ('Pastilhas de Freio', 41), ('Peças de Reposição', 42), ('Piscas', 43), ('Porta-objetos', 44),
  ('Protetores', 45), ('Rádios', 46), ('Relés', 47), ('Sensores', 48),
  ('Silicones', 49), ('Suportes', 50), ('Tapetes Automotivos', 51), ('Tintas Automotivas', 52),
  ('Travas Elétricas', 53), ('Válvulas', 54), ('Ventoinhas', 55), ('Vidros Automotivos', 56)
) AS sub(nome, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_catalogo 
  WHERE nivel = 3 AND nome = sub.nome AND categoria_id = nivel2_carros.id
);

-- ACESSÓRIOS PARA VEÍCULOS > MOTOS (mais subcategorias)  
WITH nivel2_motos AS (
  SELECT id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Motos' 
  AND categoria_principal_id = (SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Acessórios para Veículos')
)
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, 
  (SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Acessórios para Veículos'),
  nivel2_motos.id,
  'Acessórios para Veículos > Motos > ' || sub.nome
FROM nivel2_motos,
(VALUES 
  ('Aceleração', 1), ('Adesivos para Motos', 2), ('Alarmes para Motos', 3), ('Bagageiros', 4),
  ('Baterias para Motos', 5), ('Bobinas', 6), ('Buzinas para Motos', 7), ('Cabos para Motos', 8),
  ('Capacetes', 9), ('Carburadores', 10), ('Carenagens', 11), ('CDI', 12),
  ('Chassi', 13), ('Cilindros', 14), ('Correntes', 15), ('Embreagem para Motos', 16),
  ('Escapamentos para Motos', 17), ('Espelhos para Motos', 18), ('Faróis para Motos', 19), ('Filtros para Motos', 20),
  ('Freios para Motos', 21), ('Guidões', 22), ('Ignição', 23), ('Instrumentos para Motos', 24),
  ('Jaquetas', 25), ('Kits para Motos', 26), ('Lanternas para Motos', 27), ('Luvas', 28),
  ('Luzes para Motos', 29), ('Manetes', 30), ('Motores para Motos', 31), ('Óleos para Motos', 32),
  ('Para-lamas para Motos', 33), ('Pastilhas para Motos', 34), ('Pedais', 35), ('Peças de Motor para Motos', 36),
  ('Piscas para Motos', 37), ('Pistões', 38), ('Pneus para Motos', 39), ('Protetores para Motos', 40),
  ('Punhos', 41), ('Radiadores para Motos', 42), ('Retentores', 43), ('Rodas para Motos', 44),
  ('Suspensão para Motos', 45), ('Tanques', 46), ('Transmissão para Motos', 47), ('Válvulas para Motos', 48)
) AS sub(nome, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_catalogo 
  WHERE nivel = 3 AND nome = sub.nome AND categoria_id = nivel2_motos.id
);

-- AGRO (categoria principal completa)
WITH agro_principal AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Agro'
)
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, cat.nome, cat.ordem, true, agro_principal.id, 'Agro > ' || cat.nome
FROM agro_principal,
(VALUES 
  ('Adubos e Fertilizantes', 1), ('Animais', 2), ('Defensivos', 3), ('Equipamentos', 4),
  ('Ferramentas Agrícolas', 5), ('Irrigação', 6), ('Máquinas Agrícolas', 7), ('Mudas e Sementes', 8),
  ('Pecuária', 9), ('Suplementos', 10)
) AS cat(nome, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = cat.nome AND categoria_principal_id = agro_principal.id
);

-- AGRO > ADUBOS E FERTILIZANTES
WITH agro_adubos AS (
  SELECT id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Adubos e Fertilizantes' 
  AND categoria_principal_id = (SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Agro')
)
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, 
  (SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Agro'),
  agro_adubos.id,
  'Agro > Adubos e Fertilizantes > ' || sub.nome
FROM agro_adubos,
(VALUES 
  ('Adubos Orgânicos', 1), ('Adubos Químicos', 2), ('Corretivos', 3), ('Fertilizantes Foliares', 4),
  ('Fertilizantes Granulados', 5), ('Fertilizantes Líquidos', 6), ('Micronutrientes', 7), ('NPK', 8),
  ('Substratos', 9), ('Outros Adubos', 10)
) AS sub(nome, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_catalogo 
  WHERE nivel = 3 AND nome = sub.nome AND categoria_id = agro_adubos.id
);

-- ALIMENTOS E BEBIDAS (expandida)
WITH alimentos_principal AS (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Alimentos e Bebidas'
)
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
SELECT 2, cat.nome, cat.ordem, true, alimentos_principal.id, 'Alimentos e Bebidas > ' || cat.nome
FROM alimentos_principal,
(VALUES 
  ('Bebidas', 1), ('Carnes e Peixes', 2), ('Cereais e Grãos', 3), ('Conservas', 4),
  ('Doces e Sobremesas', 5), ('Frios e Laticínios', 6), ('Frutas e Verduras', 7), ('Condimentos', 8),
  ('Produtos Naturais', 9), ('Suplementos Alimentares', 10)
) AS cat(nome, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = cat.nome AND categoria_principal_id = alimentos_principal.id
);

-- ALIMENTOS E BEBIDAS > BEBIDAS
WITH bebidas AS (
  SELECT id FROM public.categorias_catalogo 
  WHERE nivel = 2 AND nome = 'Bebidas' 
  AND categoria_principal_id = (SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Alimentos e Bebidas')
)
INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
SELECT 3, sub.nome, sub.ordem, true, 
  (SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Alimentos e Bebidas'),
  bebidas.id,
  'Alimentos e Bebidas > Bebidas > ' || sub.nome
FROM bebidas,
(VALUES 
  ('Águas', 1), ('Cervejas', 2), ('Destilados', 3), ('Energéticos', 4),
  ('Isotônicos', 5), ('Refrigerantes', 6), ('Sucos', 7), ('Vinhos', 8),
  ('Cafés e Chás', 9), ('Outras Bebidas', 10)
) AS sub(nome, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_catalogo 
  WHERE nivel = 3 AND nome = sub.nome AND categoria_id = bebidas.id
);

-- Log do progresso
DO $$
DECLARE
  total_l1 integer;
  total_l2 integer;
  total_l3 integer;
BEGIN
  SELECT COUNT(*) INTO total_l1 FROM public.categorias_catalogo WHERE nivel = 1;
  SELECT COUNT(*) INTO total_l2 FROM public.categorias_catalogo WHERE nivel = 2;
  SELECT COUNT(*) INTO total_l3 FROM public.categorias_catalogo WHERE nivel = 3;
  RAISE NOTICE 'Após importação: L1=%, L2=%, L3=%', total_l1, total_l2, total_l3;
END;
$$;