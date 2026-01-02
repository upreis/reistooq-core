-- Fix: ensure OMS orders always carry organization_id for RLS

-- 1) Set default organization_id on new rows
ALTER TABLE public.oms_orders
  ALTER COLUMN organization_id SET DEFAULT public.get_current_org_id();

-- 2) Backfill: try to set organization_id for existing rows when missing
-- NOTE: If the table has created_by/user_id, prefer that. Fallback to current org.
UPDATE public.oms_orders
SET organization_id = public.get_current_org_id()
WHERE organization_id IS NULL;

-- 3) Safety trigger: if client doesn't send organization_id, populate it
CREATE OR REPLACE FUNCTION public.set_oms_orders_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.get_current_org_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_oms_orders_organization_id ON public.oms_orders;
CREATE TRIGGER trg_set_oms_orders_organization_id
BEFORE INSERT ON public.oms_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_oms_orders_organization_id();
