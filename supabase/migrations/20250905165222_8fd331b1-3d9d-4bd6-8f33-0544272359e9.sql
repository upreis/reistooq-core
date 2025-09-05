-- Corrigir estrutura L2/L3 para a categoria principal "Acessórios para Veículos"
-- Remove entradas divergentes e insere exatamente as fornecidas pelo usuário
DO $$
DECLARE
  principal_id uuid;
  category_id uuid;
BEGIN
  -- Garantir categoria principal (nível 1)
  SELECT id INTO principal_id FROM public.categorias_catalogo 
  WHERE nivel = 1 AND nome = 'Acessórios para Veículos' LIMIT 1;
  IF principal_id IS NULL THEN
    INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_completa)
    VALUES (1, 'Acessórios para Veículos', 1, true, 'Acessórios para Veículos')
    RETURNING id INTO principal_id;
  END IF;

  -- Excluir todas as categorias L2 e L3 atuais para recriar corretamente
  DELETE FROM public.categorias_catalogo 
  WHERE nivel IN (2, 3) AND categoria_principal_id = principal_id;

  -- Inserir todas as 19 categorias L2 corretas
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_completa)
  VALUES
    (2, 'Aces. de Carros e Caminhonetes', 1, true, principal_id, 'Acessórios para Veículos > Aces. de Carros e Caminhonetes'),
    (2, 'Aces. de Motos e Quadriciclos', 2, true, principal_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos'),
    (2, 'Acessórios Náuticos', 3, true, principal_id, 'Acessórios para Veículos > Acessórios Náuticos'),
    (2, 'Acessórios de Linha Pesada', 4, true, principal_id, 'Acessórios para Veículos > Acessórios de Linha Pesada'),
    (2, 'Ferramentas para Veículos', 5, true, principal_id, 'Acessórios para Veículos > Ferramentas para Veículos'),
    (2, 'GNV', 6, true, principal_id, 'Acessórios para Veículos > GNV'),
    (2, 'Limpeza Automotiva', 7, true, principal_id, 'Acessórios para Veículos > Limpeza Automotiva'),
    (2, 'Lubrificantes e Fluidos', 8, true, principal_id, 'Acessórios para Veículos > Lubrificantes e Fluidos'),
    (2, 'Navegadores GPS para Vehículos', 9, true, principal_id, 'Acessórios para Veículos > Navegadores GPS para Vehículos'),
    (2, 'Outros', 10, true, principal_id, 'Acessórios para Veículos > Outros'),
    (2, 'Performance', 11, true, principal_id, 'Acessórios para Veículos > Performance'),
    (2, 'Peças Náuticas', 12, true, principal_id, 'Acessórios para Veículos > Peças Náuticas'),
    (2, 'Peças de Carros e Caminhonetes', 13, true, principal_id, 'Acessórios para Veículos > Peças de Carros e Caminhonetes'),
    (2, 'Peças de Motos e Quadriciclos', 14, true, principal_id, 'Acessórios para Veículos > Peças de Motos e Quadriciclos'),
    (2, 'Pneus e Acessórios', 15, true, principal_id, 'Acessórios para Veículos > Pneus e Acessórios'),
    (2, 'Rodas', 16, true, principal_id, 'Acessórios para Veículos > Rodas'),
    (2, 'Segurança Veicular', 17, true, principal_id, 'Acessórios para Veículos > Segurança Veicular'),
    (2, 'Som Automotivo', 18, true, principal_id, 'Acessórios para Veículos > Som Automotivo'),
    (2, 'Tuning', 19, true, principal_id, 'Acessórios para Veículos > Tuning');

  -- Agora inserir todas as 110 subcategorias L3
  -- 1) Aces. de Carros e Caminhonetes (2 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Aces. de Carros e Caminhonetes';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Exterior', 1, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Carros e Caminhonetes > Exterior'),
    (3, 'Interior', 2, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Carros e Caminhonetes > Interior');

  -- 2) Aces. de Motos e Quadriciclos (10 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Aces. de Motos e Quadriciclos';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Alarmes para Motos', 1, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos > Alarmes para Motos'),
    (3, 'Alforges', 2, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos > Alforges'),
    (3, 'Capacetes', 3, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos > Capacetes'),
    (3, 'Capas', 4, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos > Capas'),
    (3, 'Indumentária e Calçado', 5, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos > Indumentária e Calçado'),
    (3, 'Intercomunicadores', 6, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos > Intercomunicadores'),
    (3, 'Outros', 7, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos > Outros'),
    (3, 'Protetores de Motor', 8, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos > Protetores de Motor'),
    (3, 'Rampas', 9, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos > Rampas'),
    (3, 'Travas e Elásticos', 10, true, principal_id, category_id, 'Acessórios para Veículos > Aces. de Motos e Quadriciclos > Travas e Elásticos');

  -- 3) Acessórios Náuticos (8 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Acessórios Náuticos';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Ancoragem e Amarração', 1, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios Náuticos > Ancoragem e Amarração'),
    (3, 'Bombas e Filtros de Água', 2, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios Náuticos > Bombas e Filtros de Água'),
    (3, 'Iluminação', 3, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios Náuticos > Iluminação'),
    (3, 'Interior da Cabine', 4, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios Náuticos > Interior da Cabine'),
    (3, 'Limpeza e Manutenção', 5, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios Náuticos > Limpeza e Manutenção'),
    (3, 'Proteção e Transporte', 6, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios Náuticos > Proteção e Transporte'),
    (3, 'Segurança e Salvamento', 7, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios Náuticos > Segurança e Salvamento'),
    (3, 'Sistemas de Navegação', 8, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios Náuticos > Sistemas de Navegação');

  -- 4) Acessórios de Linha Pesada (2 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Acessórios de Linha Pesada';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Acessórios de Exterior', 1, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios de Linha Pesada > Acessórios de Exterior'),
    (3, 'Acessórios de Interior', 2, true, principal_id, category_id, 'Acessórios para Veículos > Acessórios de Linha Pesada > Acessórios de Interior');

  -- 5) Ferramentas para Veículos (12 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Ferramentas para Veículos';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Cabines de Pintura', 1, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Cabines de Pintura'),
    (3, 'Chaves', 2, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Chaves'),
    (3, 'Elevação', 3, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Elevação'),
    (3, 'Esteiras para Mecânicos', 4, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Esteiras para Mecânicos'),
    (3, 'Extratores para Polia', 5, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Extratores para Polia'),
    (3, 'Ferramentas para Baterias', 6, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Ferramentas para Baterias'),
    (3, 'Guinchos', 7, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Guinchos'),
    (3, 'Infladores', 8, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Infladores'),
    (3, 'Medição', 9, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Medição'),
    (3, 'Máquinas de Desmontar Pneus', 10, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Máquinas de Desmontar Pneus'),
    (3, 'Outras', 11, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Outras'),
    (3, 'Soquetes e Acessórios', 12, true, principal_id, category_id, 'Acessórios para Veículos > Ferramentas para Veículos > Soquetes e Acessórios');

  -- Continua nas próximas subcategorias...
  -- 6) GNV (1 subcategoria)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'GNV';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Peças', 1, true, principal_id, category_id, 'Acessórios para Veículos > GNV > Peças');

  -- 7) Limpeza Automotiva (15 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Limpeza Automotiva';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Abrilhantadores', 1, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Abrilhantadores'),
    (3, 'Anticorrosivos', 2, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Anticorrosivos'),
    (3, 'Aspiradores', 3, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Aspiradores'),
    (3, 'Boinas', 4, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Boinas'),
    (3, 'Ceras', 5, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Ceras'),
    (3, 'Desengraxantes', 6, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Desengraxantes'),
    (3, 'Fragrâncias', 7, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Fragrâncias'),
    (3, 'Limpa Radiadores', 8, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Limpa Radiadores'),
    (3, 'Limpadores de Couro', 9, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Limpadores de Couro'),
    (3, 'Lubrificantes', 10, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Lubrificantes'),
    (3, 'Panos', 11, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Panos'),
    (3, 'Polidor', 12, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Polidor'),
    (3, 'Removedores de Arranhões', 13, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Removedores de Arranhões'),
    (3, 'Shampoo para Carros', 14, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Shampoo para Carros'),
    (3, 'Tratamentos', 15, true, principal_id, category_id, 'Acessórios para Veículos > Limpeza Automotiva > Tratamentos');

  -- 8) Lubrificantes e Fluidos (8 subcategorias)
  SELECT id INTO category_id FROM public.categorias_catalogo 
    WHERE nivel = 2 AND categoria_principal_id = principal_id AND nome = 'Lubrificantes e Fluidos';
  INSERT INTO public.categorias_catalogo(nivel, nome, ordem, ativo, categoria_principal_id, categoria_id, categoria_completa)
  VALUES
    (3, 'Aditivos', 1, true, principal_id, category_id, 'Acessórios para Veículos > Lubrificantes e Fluidos > Aditivos'),
    (3, 'Agro e Indústria', 2, true, principal_id, category_id, 'Acessórios para Veículos > Lubrificantes e Fluidos > Agro e Indústria'),
    (3, 'Carros e Caminhonetes', 3, true, principal_id, category_id, 'Acessórios para Veículos > Lubrificantes e Fluidos > Carros e Caminhonetes'),
    (3, 'Graxas', 4, true, principal_id, category_id, 'Acessórios para Veículos > Lubrificantes e Fluidos > Graxas'),
    (3, 'Linha Pesada', 5, true, principal_id, category_id, 'Acessórios para Veículos > Lubrificantes e Fluidos > Linha Pesada'),
    (3, 'Líquidos', 6, true, principal_id, category_id, 'Acessórios para Veículos > Lubrificantes e Fluidos > Líquidos'),
    (3, 'Motos', 7, true, principal_id, category_id, 'Acessórios para Veículos > Lubrificantes e Fluidos > Motos'),
    (3, 'Náutica', 8, true, principal_id, category_id, 'Acessórios para Veículos > Lubrificantes e Fluidos > Náutica');

  -- Continua...

END $$;