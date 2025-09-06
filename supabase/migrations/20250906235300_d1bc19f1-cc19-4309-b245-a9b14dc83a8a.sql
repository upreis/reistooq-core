-- Final fix: Enable RLS on views by converting to tables or creating proper security

-- The issue is that views in PostgreSQL don't support RLS directly
-- We need to either convert to tables or ensure the underlying queries are secure

-- 1. First, let's check what exact permissions are causing issues and fix them
-- Drop the safe views and recreate as proper RLS-enabled tables instead

DROP VIEW IF EXISTS public.clientes_safe CASCADE;
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;

-- Create clientes_safe as a materialized view with proper RLS
CREATE TABLE public.clientes_safe_secure (
  id uuid PRIMARY KEY,
  nome_completo text,
  email text, 
  telefone text,
  cpf_cnpj text,
  organization_id uuid NOT NULL REFERENCES public.organizacoes(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the secure table
ALTER TABLE public.clientes_safe_secure ENABLE ROW LEVEL SECURITY;

-- Create restrictive RLS policy
CREATE POLICY "clientes_safe_secure_org_read" ON public.clientes_safe_secure
  FOR SELECT TO authenticated
  USING (
    organization_id = public.get_current_org_id() AND 
    public.has_permission('customers:read')
  );

-- Block all other operations
CREATE POLICY "clientes_safe_secure_no_write" ON public.clientes_safe_secure
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- Create a secure function to populate this table (controlled access)
CREATE OR REPLACE FUNCTION public.get_masked_clients()
RETURNS SETOF public.clientes_safe_secure
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only users with proper permissions can call this
  IF NOT public.has_permission('customers:read') THEN
    RAISE EXCEPTION 'Access denied: customers:read permission required';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    CASE 
      WHEN public.has_permission('customers:read_full') THEN c.nome_completo
      ELSE public.mask_name(c.nome_completo)
    END as nome_completo,
    CASE 
      WHEN public.has_permission('customers:read_full') THEN c.email
      ELSE regexp_replace(c.email, '(.{2}).*(@.*)', '\1***\2')
    END as email,
    CASE 
      WHEN public.has_permission('customers:read_full') THEN c.telefone
      ELSE public.mask_phone(c.telefone)
    END as telefone,
    CASE 
      WHEN public.has_permission('customers:read_full') THEN c.cpf_cnpj
      ELSE regexp_replace(c.cpf_cnpj, '(.{3}).*(.{2})', '\1***\2')
    END as cpf_cnpj,
    c.organization_id,
    c.created_at,
    c.updated_at
  FROM public.clientes c
  WHERE c.organization_id = public.get_current_org_id();
END;
$$;

-- 2. Create secure sales history access function instead of view
CREATE OR REPLACE FUNCTION public.get_masked_sales_history(
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  numero_pedido text,
  cliente_nome text,
  valor_total numeric,
  data_pedido date,
  status text,
  organization_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check permissions
  IF NOT public.has_permission('sales:read') THEN
    RAISE EXCEPTION 'Access denied: sales:read permission required';
  END IF;

  RETURN QUERY
  SELECT 
    h.id,
    h.numero_pedido,
    CASE 
      WHEN public.has_permission('sales:read_full') THEN h.cliente_nome
      ELSE public.mask_name(h.cliente_nome)
    END as cliente_nome,
    h.valor_total,
    h.data_pedido,
    h.status,
    ia.organization_id
  FROM public.historico_vendas h
  JOIN public.integration_accounts ia ON ia.id = h.integration_account_id
  WHERE ia.organization_id = public.get_current_org_id()
  ORDER BY h.created_at DESC
  LIMIT COALESCE(_limit, 100)
  OFFSET COALESCE(_offset, 0);
END;
$$;

-- 3. Revoke all access to the original sensitive table from regular users
-- Keep only service-level access for the above functions
REVOKE ALL ON public.clientes FROM authenticated;
REVOKE ALL ON public.historico_vendas FROM authenticated;

-- Grant only the specific permissions needed for the secure functions to work
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_masked_clients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_masked_sales_history(integer, integer) TO authenticated;