-- Fix remaining security issues without duplicate policies

-- 1. Secure the clientes table with audit logging (already done in previous migration)

-- 2. Restrict categorias_catalogo access (already done in previous migration)

-- 3. Restrict categorias_produtos level 1 public access (already done in previous migration)

-- 4. Drop existing policies on system_alerts before creating new ones
DROP POLICY IF EXISTS "system_alerts_org_read" ON public.system_alerts;
DROP POLICY IF EXISTS "system_alerts_admin_manage" ON public.system_alerts;

-- Secure system_alerts table with new policies
CREATE POLICY "system_alerts_org_read" ON public.system_alerts
  FOR SELECT TO authenticated
  USING (
    organization_id = get_current_org_id() AND 
    active = true AND 
    (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "system_alerts_admin_manage" ON public.system_alerts
  FOR ALL TO authenticated
  USING (
    organization_id = get_current_org_id() AND 
    public.has_permission('system:alerts')
  )
  WITH CHECK (
    organization_id = get_current_org_id() AND 
    public.has_permission('system:alerts')
  );

-- 5. Fix more function search paths that are still missing
CREATE OR REPLACE FUNCTION public.set_produtos_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id = public.get_current_org_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.verificar_componentes_antes_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  componentes_usando text[];
  produtos_afetados text;
BEGIN
  -- Buscar produtos de composições que usam este componente
  SELECT array_agg(DISTINCT nome_produto_composicao) INTO componentes_usando
  FROM public.componentes_em_uso
  WHERE sku_componente = OLD.sku_interno 
    AND organization_id = OLD.organization_id;
    
  -- Se há produtos usando este componente, impedir a exclusão
  IF array_length(componentes_usando, 1) > 0 THEN
    produtos_afetados := array_to_string(componentes_usando, ', ');
    RAISE EXCEPTION 'COMPONENTE_EM_USO: Este componente está sendo usado nas seguintes composições: %. Remova-o das composições antes de excluir ou substitua por outro componente.', produtos_afetados
      USING HINT = 'Vá até a aba Composições e edite os produtos afetados';
  END IF;
  
  RETURN OLD;
END;
$$;

-- 6. Create a final security validation function
CREATE OR REPLACE FUNCTION public.validate_security_settings()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  result := json_build_object(
    'rls_enabled_tables', (
      SELECT count(*) FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
    ),
    'secure_functions', (
      SELECT count(*) FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      AND p.prosecdef = true
    ),
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;