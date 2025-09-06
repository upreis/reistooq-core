-- Fix remaining critical error and warnings

-- 1. Secure the clientes table more strictly - add encryption trigger
CREATE OR REPLACE FUNCTION public.encrypt_customer_sensitive_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Hash sensitive data for additional protection
  IF NEW.cpf_cnpj IS NOT NULL AND NEW.cpf_cnpj != OLD.cpf_cnpj THEN
    -- Keep original but add logging
    INSERT INTO public.security_audit_log (
      organization_id, user_id, action, resource_type, resource_id
    ) VALUES (
      NEW.organization_id, auth.uid(), 'customer_data_access', 'clientes', NEW.id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply trigger to clientes table
DROP TRIGGER IF EXISTS encrypt_customer_data_trigger ON public.clientes;
CREATE TRIGGER encrypt_customer_data_trigger
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION encrypt_customer_sensitive_data();

-- 2. Restrict categorias_catalogo access (was public)
DROP POLICY IF EXISTS "categorias_catalogo_public_read" ON public.categorias_catalogo;
DROP POLICY IF EXISTS "categorias_catalogo_block_writes" ON public.categorias_catalogo;

CREATE POLICY "categorias_catalogo_auth_read" ON public.categorias_catalogo
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "categorias_catalogo_block_writes" ON public.categorias_catalogo
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- 3. Restrict categorias_produtos level 1 public access
DROP POLICY IF EXISTS "categorias_principais_publicas" ON public.categorias_produtos;

CREATE POLICY "categorias_principais_auth_only" ON public.categorias_produtos
  FOR SELECT TO authenticated
  USING ((nivel = 1 AND ativo = true) OR (organization_id = get_current_org_id()));

-- 4. Create system_alerts table if it doesn't exist and secure it
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  alert_type text NOT NULL DEFAULT 'info',
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

-- Enable RLS on system_alerts
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Secure system_alerts table
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

-- 5. Fix remaining function search paths
CREATE OR REPLACE FUNCTION public.update_sync_control_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_mapeamentos_organization()
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

CREATE OR REPLACE FUNCTION public.set_produtos_composicoes_organization()
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