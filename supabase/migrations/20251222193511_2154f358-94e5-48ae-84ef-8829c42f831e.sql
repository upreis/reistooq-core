-- Corrigir o nome do Estoque Principal que foi alterado incorretamente
UPDATE locais_estoque 
SET nome = 'Estoque Principal'
WHERE tipo = 'principal';