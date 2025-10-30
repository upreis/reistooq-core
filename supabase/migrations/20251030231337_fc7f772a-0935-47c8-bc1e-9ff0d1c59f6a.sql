-- Criar trigger para auto-preencher organization_id
CREATE OR REPLACE FUNCTION public.set_composicoes_insumos_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.get_current_org_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Aplicar trigger antes do INSERT
CREATE TRIGGER set_composicoes_insumos_org_before_insert
  BEFORE INSERT ON public.composicoes_insumos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_composicoes_insumos_organization();