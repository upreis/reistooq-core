-- Migrar composições antigas (sem local_id) para o Estoque Principal

-- Atualizar produto_componentes antigos
UPDATE produto_componentes
SET local_id = '60f8074d-13ec-4be3-bea6-a1df954c6fc4'::uuid
WHERE local_id IS NULL;

-- Atualizar composicoes_insumos antigos
UPDATE composicoes_insumos
SET local_id = '60f8074d-13ec-4be3-bea6-a1df954c6fc4'::uuid
WHERE local_id IS NULL;