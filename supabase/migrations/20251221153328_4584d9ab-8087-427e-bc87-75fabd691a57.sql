
-- 1. Excluir os mapeamentos vazios que têm versão preenchida (duplicados)
DELETE FROM mapeamentos_depara m1
WHERE (m1.sku_correspondente IS NULL OR m1.sku_correspondente = '')
  AND EXISTS (
    SELECT 1 FROM mapeamentos_depara m2 
    WHERE UPPER(m1.sku_pedido) = UPPER(m2.sku_pedido)
      AND m2.sku_correspondente IS NOT NULL 
      AND m2.sku_correspondente != ''
      AND m1.id != m2.id
  );
