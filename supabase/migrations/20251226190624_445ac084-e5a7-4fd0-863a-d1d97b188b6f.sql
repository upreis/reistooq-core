-- Fix RLS for composicoes_local_venda to allow org-scoped CRUD

-- Ensure RLS is enabled
ALTER TABLE public.composicoes_local_venda ENABLE ROW LEVEL SECURITY;

-- Ensure organization_id is set by default (keeps inserts safe even if client omits)
ALTER TABLE public.composicoes_local_venda ALTER COLUMN organization_id SET DEFAULT public.get_current_org_id();

-- Drop overly restrictive or legacy policies if they exist (idempotent)
DO $$
BEGIN
  -- SELECT
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'composicoes_local_venda' AND policyname = 'composicoes_local_venda_select_org'
  ) THEN
    DROP POLICY "composicoes_local_venda_select_org" ON public.composicoes_local_venda;
  END IF;

  -- INSERT
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'composicoes_local_venda' AND policyname = 'composicoes_local_venda_insert_org'
  ) THEN
    DROP POLICY "composicoes_local_venda_insert_org" ON public.composicoes_local_venda;
  END IF;

  -- UPDATE
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'composicoes_local_venda' AND policyname = 'composicoes_local_venda_update_org'
  ) THEN
    DROP POLICY "composicoes_local_venda_update_org" ON public.composicoes_local_venda;
  END IF;

  -- DELETE
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'composicoes_local_venda' AND policyname = 'composicoes_local_venda_delete_org'
  ) THEN
    DROP POLICY "composicoes_local_venda_delete_org" ON public.composicoes_local_venda;
  END IF;
END $$;

-- Org-scoped policies
CREATE POLICY "composicoes_local_venda_select_org"
ON public.composicoes_local_venda
FOR SELECT
TO authenticated
USING (organization_id = public.get_current_org_id());

CREATE POLICY "composicoes_local_venda_insert_org"
ON public.composicoes_local_venda
FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_current_org_id());

CREATE POLICY "composicoes_local_venda_update_org"
ON public.composicoes_local_venda
FOR UPDATE
TO authenticated
USING (organization_id = public.get_current_org_id())
WITH CHECK (organization_id = public.get_current_org_id());

CREATE POLICY "composicoes_local_venda_delete_org"
ON public.composicoes_local_venda
FOR DELETE
TO authenticated
USING (organization_id = public.get_current_org_id());

-- Helpful indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_composicoes_local_venda_org_local_prod
ON public.composicoes_local_venda (organization_id, local_venda_id, sku_produto);
