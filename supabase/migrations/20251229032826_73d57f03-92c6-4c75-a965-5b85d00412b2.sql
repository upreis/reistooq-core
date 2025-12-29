-- Fix RLS for pedidos_shopee to rely on authenticated user's profile organization

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.pedidos_shopee ENABLE ROW LEVEL SECURITY;

-- Drop old policies that depend on get_current_org_id()
DROP POLICY IF EXISTS pedidos_shopee_org_select ON public.pedidos_shopee;
DROP POLICY IF EXISTS pedidos_shopee_org_insert ON public.pedidos_shopee;
DROP POLICY IF EXISTS pedidos_shopee_org_update ON public.pedidos_shopee;
DROP POLICY IF EXISTS pedidos_shopee_org_delete ON public.pedidos_shopee;

-- Create new policies based on profiles.organizacao_id
CREATE POLICY pedidos_shopee_select_own_org
ON public.pedidos_shopee
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.organizacao_id = pedidos_shopee.organization_id
  )
);

CREATE POLICY pedidos_shopee_insert_own_org
ON public.pedidos_shopee
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.organizacao_id = pedidos_shopee.organization_id
  )
);

CREATE POLICY pedidos_shopee_update_own_org
ON public.pedidos_shopee
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.organizacao_id = pedidos_shopee.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.organizacao_id = pedidos_shopee.organization_id
  )
);

CREATE POLICY pedidos_shopee_delete_own_org
ON public.pedidos_shopee
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.organizacao_id = pedidos_shopee.organization_id
  )
);
