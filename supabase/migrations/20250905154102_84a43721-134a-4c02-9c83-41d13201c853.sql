-- Remover subcategorias de nível 3 do catálogo para manter consistência
-- Mantendo apenas níveis 1 (principais) e 2 (categorias)
DELETE FROM public.categorias_catalogo 
WHERE nivel = 3;

-- Atualizar a função seed para não mais criar nível 3
-- (A função já foi atualizada para não criar mais níveis 3, mas garantindo que está limpo)