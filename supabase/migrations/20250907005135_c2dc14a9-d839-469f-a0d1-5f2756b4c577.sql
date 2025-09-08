-- Drop existing function and recreate with enhanced security
DROP FUNCTION IF EXISTS public.get_masked_clients();

-- Create enhanced get_masked_clients function with complete security features
CREATE OR REPLACE FUNCTION public.get_masked_clients()
RETURNS TABLE(
  id uuid,
  nome_completo text,
  email text,
  telefone text,
  cpf_cnpj text,
  endereco_cidade text,
  endereco_uf text,
  status_cliente text,
  total_pedidos integer,
  valor_total_gasto numeric,
  ticket_medio numeric,
  data_primeiro_pedido date,
  data_ultimo_pedido date,
  observacoes text,
  empresa text,
  organization_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check basic permission
  IF NOT public.has_permission('customers:read') THEN
    RAISE EXCEPTION 'Access denied: customers:read permission required';
  END IF;

  -- Log access for audit purposes
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    source_function
  ) VALUES (
    public.get_current_org_id(),
    auth.uid(),
    'read',
    'customers',
    'bulk_access',
    'get_masked_clients'
  );

  RETURN QUERY
  SELECT 
    c.id,
    -- Name masking based on PII permissions
    CASE 
      WHEN public.has_permission('customers:view_pii') THEN c.nome_completo
      ELSE public.mask_name(c.nome_completo)
    END as nome_completo,
    -- Email masking
    CASE 
      WHEN public.has_permission('customers:view_pii') THEN c.email
      WHEN c.email IS NOT NULL THEN 
        CASE 
          WHEN position('@' in c.email) > 3 THEN
            left(c.email, 2) || repeat('*', position('@' in c.email) - 3) || right(c.email, length(c.email) - position('@' in c.email) + 1)
          ELSE '***' || right(c.email, length(c.email) - position('@' in c.email) + 1)
        END
      ELSE NULL
    END as email,
    -- Phone masking
    CASE 
      WHEN public.has_permission('customers:view_pii') THEN c.telefone
      ELSE public.mask_phone(c.telefone)
    END as telefone,
    -- CPF/CNPJ masking
    CASE 
      WHEN public.has_permission('customers:view_pii') THEN c.cpf_cnpj
      WHEN c.cpf_cnpj IS NOT NULL AND length(c.cpf_cnpj) > 6 THEN
        left(c.cpf_cnpj, 3) || repeat('*', length(c.cpf_cnpj) - 5) || right(c.cpf_cnpj, 2)
      WHEN c.cpf_cnpj IS NOT NULL THEN repeat('*', length(c.cpf_cnpj))
      ELSE NULL
    END as cpf_cnpj,
    -- Address data - only for users with PII permission
    CASE 
      WHEN public.has_permission('customers:view_pii') THEN c.endereco_cidade
      ELSE NULL
    END as endereco_cidade,
    CASE 
      WHEN public.has_permission('customers:view_pii') THEN c.endereco_uf
      ELSE NULL
    END as endereco_uf,
    -- Non-sensitive data always visible
    c.status_cliente,
    c.total_pedidos,
    c.valor_total_gasto,
    c.ticket_medio,
    c.data_primeiro_pedido,
    c.data_ultimo_pedido,
    -- Sensitive observations only for PII users
    CASE 
      WHEN public.has_permission('customers:view_pii') THEN c.observacoes
      ELSE NULL
    END as observacoes,
    c.empresa,
    c.organization_id,
    c.created_at,
    c.updated_at
  FROM public.clientes c
  WHERE c.organization_id = public.get_current_org_id()
  ORDER BY c.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_masked_clients() TO authenticated;