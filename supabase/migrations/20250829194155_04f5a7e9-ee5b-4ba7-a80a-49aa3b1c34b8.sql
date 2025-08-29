-- Política para permitir criação de mapeamentos automáticos
CREATE POLICY "mapeamentos_depara: users can insert with org"
ON public.mapeamentos_depara 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = get_current_org_id());

-- Trigger para garantir que organization_id seja sempre preenchido
CREATE OR REPLACE FUNCTION public.set_mapeamentos_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id = public.get_current_org_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_mapeamentos_org_trigger
  BEFORE INSERT ON public.mapeamentos_depara
  FOR EACH ROW
  EXECUTE FUNCTION public.set_mapeamentos_organization();