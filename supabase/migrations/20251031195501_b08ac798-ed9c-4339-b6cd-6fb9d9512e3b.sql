-- Deletar composições órfãs (produto_componentes sem produto pai em produtos_composicoes)
DELETE FROM produto_componentes
WHERE sku_produto IN (
  SELECT DISTINCT pc.sku_produto
  FROM produto_componentes pc
  LEFT JOIN produtos_composicoes p ON pc.sku_produto = p.sku_interno
  WHERE p.id IS NULL
);