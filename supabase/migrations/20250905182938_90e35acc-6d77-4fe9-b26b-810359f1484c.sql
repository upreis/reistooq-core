-- Remover categorias de nível 1 que não têm subcategorias de nível 2
DELETE FROM public.categorias_catalogo 
WHERE nivel = 1 
AND id NOT IN (
  SELECT DISTINCT categoria_principal_id 
  FROM public.categorias_catalogo 
  WHERE nivel = 2 
  AND categoria_principal_id IS NOT NULL
);