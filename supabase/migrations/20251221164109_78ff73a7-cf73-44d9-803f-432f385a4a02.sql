-- Fix unique constraint to allow same product/component across different stock locations
ALTER TABLE public.produto_componentes
  DROP CONSTRAINT IF EXISTS produto_componentes_unique_per_org;

ALTER TABLE public.produto_componentes
  ADD CONSTRAINT produto_componentes_unique_per_org_local
  UNIQUE (sku_produto, sku_componente, organization_id, local_id);
