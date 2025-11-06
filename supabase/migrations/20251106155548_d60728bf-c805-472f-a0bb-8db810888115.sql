-- Clonar insumos do Estoque Principal para os outros locais
-- Clonar para FULL LUTHOR
INSERT INTO composicoes_insumos (
  organization_id,
  sku_produto,
  sku_insumo,
  quantidade,
  observacoes,
  ativo,
  local_id
)
SELECT 
  organization_id,
  sku_produto,
  sku_insumo,
  quantidade,
  observacoes,
  ativo,
  '19d12c0d-2bdb-4cd8-a826-21d918c7910e'::uuid as local_id
FROM composicoes_insumos
WHERE local_id = '60f8074d-13ec-4be3-bea6-a1df954c6fc4'::uuid
  AND ativo = true
ON CONFLICT (organization_id, sku_produto, sku_insumo, local_id) DO NOTHING;

-- Clonar para FULL PLATINUM
INSERT INTO composicoes_insumos (
  organization_id,
  sku_produto,
  sku_insumo,
  quantidade,
  observacoes,
  ativo,
  local_id
)
SELECT 
  organization_id,
  sku_produto,
  sku_insumo,
  quantidade,
  observacoes,
  ativo,
  '80d63165-ee04-4645-a574-fb4f95a1f894'::uuid as local_id
FROM composicoes_insumos
WHERE local_id = '60f8074d-13ec-4be3-bea6-a1df954c6fc4'::uuid
  AND ativo = true
ON CONFLICT (organization_id, sku_produto, sku_insumo, local_id) DO NOTHING;