-- Remove categorias L2 extras do AGRO que não estão na lista oficial
DELETE FROM public.categorias_catalogo 
WHERE categoria_principal_id IN (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 1 AND nome = 'Agro'
) 
AND nivel = 2 
AND nome NOT IN (
  'Agricultura de Precisão',
  'Apicultura',
  'Armezenamento', 
  'Energia Renovável',
  'Ferramentas de Trabalho',
  'Infra-estrutura Rural',
  'Insumos Agrícolas',
  'Insumos Gadeiros',
  'Irrigação',
  'Maquinaria Agrícola',
  'Máquinas Forrageiras',
  'Produçao Animal',
  'Proteção de Culturas'
);

-- Remove também as subcategorias L3 órfãs das categorias L2 que foram removidas
DELETE FROM public.categorias_catalogo 
WHERE nivel = 3 
AND categoria_id NOT IN (
  SELECT id FROM public.categorias_catalogo WHERE nivel = 2
);