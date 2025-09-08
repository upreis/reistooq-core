-- Enhanced security for customer data protection - Fix function conflicts
-- 1. Drop and recreate enhanced masking function
DROP FUNCTION IF EXISTS public.mask_name(text);

CREATE OR REPLACE FUNCTION public.mask_name(input_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- For null inputs, return null
  IF input_name IS NULL OR trim(input_name) = '' THEN
    RETURN input_name;
  END IF;
  
  -- Split name into parts
  DECLARE
    name_parts text[];
    first_name text;
    masked_name text;
  BEGIN
    name_parts := string_to_array(trim(input_name), ' ');
    
    IF array_length(name_parts, 1) = 1 THEN
      -- Single name: show first 2 chars
      RETURN left(name_parts[1], 2) || repeat('*', greatest(length(name_parts[1]) - 2, 1));
    ELSE
      -- Multiple names: show first name + masked last name
      first_name := name_parts[1];
      masked_name := first_name || ' ' || left(name_parts[array_length(name_parts, 1)], 1) || repeat('*', greatest(length(name_parts[array_length(name_parts, 1)]) - 1, 1));
      RETURN masked_name;
    END IF;
  END;
END;
$$;

-- 2. Enhanced mask_phone function
CREATE OR REPLACE FUNCTION public.mask_phone(input_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN input_phone IS NULL OR length(trim(input_phone)) < 4 THEN input_phone
    ELSE '****' || right(trim(input_phone), 4)
  END;
$$;

-- 3. Create enhanced get_masked_clients function with better security
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

-- 4. Enhanced RLS policy for clientes table with additional security checks
DROP POLICY IF EXISTS "clientes_read_with_permissions" ON public.clientes;
DROP POLICY IF EXISTS "clientes_enhanced_read_security" ON public.clientes;

CREATE POLICY "clientes_enhanced_read_security" 
ON public.clientes 
FOR SELECT 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('customers:read')
  -- Additional security: ensure user has been active recently
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND last_sign_in_at > (now() - interval '30 days')
  )
);

-- 5. Create function to audit customer data access
CREATE OR REPLACE FUNCTION public.log_customer_access(
  customer_id uuid,
  access_type text DEFAULT 'view',
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    new_values,
    source_function,
    ip_address
  ) VALUES (
    public.get_current_org_id(),
    auth.uid(),
    access_type,
    'customer',
    customer_id::text,
    details,
    'customer_access_audit',
    inet_client_addr()
  );
EXCEPTION 
  WHEN OTHERS THEN
    -- Don't fail if audit logging fails
    NULL;
END;
$$;

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_masked_clients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_customer_access(uuid, text, jsonb) TO authenticated;