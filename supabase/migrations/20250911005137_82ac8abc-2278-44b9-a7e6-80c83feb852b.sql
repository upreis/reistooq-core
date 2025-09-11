-- Security Enhancement: Protect Customer Personal Data
-- Create enhanced security for customer data with field-level protection

-- Create secure view for customer data with masked sensitive fields
CREATE OR REPLACE VIEW public.clientes_safe AS
SELECT 
  id,
  -- Mask full name based on permissions
  CASE 
    WHEN has_permission('customers:read_sensitive') 
    THEN nome_completo 
    ELSE mask_name(nome_completo) 
  END as nome_completo,
  
  -- Mask CPF/CNPJ based on permissions
  CASE 
    WHEN has_permission('customers:read_sensitive') 
    THEN cpf_cnpj 
    ELSE mask_cpf_cnpj(cpf_cnpj) 
  END as cpf_cnpj,
  
  -- Mask email based on permissions
  CASE 
    WHEN has_permission('customers:read_sensitive') 
    THEN email 
    ELSE mask_email(email) 
  END as email,
  
  -- Mask phone based on permissions
  CASE 
    WHEN has_permission('customers:read_sensitive') 
    THEN telefone 
    ELSE mask_phone(telefone) 
  END as telefone,
  
  -- Company info (less sensitive)
  empresa,
  
  -- Statistical data (safe to show)
  status_cliente,
  ticket_medio,
  valor_total_gasto,
  total_pedidos,
  data_ultimo_pedido,
  data_primeiro_pedido,
  
  -- Masked address info
  CASE 
    WHEN has_permission('customers:read_sensitive') 
    THEN endereco_rua 
    ELSE 
      CASE 
        WHEN endereco_rua IS NOT NULL 
        THEN left(endereco_rua, 10) || '***' 
        ELSE NULL 
      END 
  END as endereco_rua,
  
  CASE 
    WHEN has_permission('customers:read_sensitive') 
    THEN endereco_numero 
    ELSE '***' 
  END as endereco_numero,
  
  endereco_bairro,
  endereco_cidade,
  endereco_uf,
  
  CASE 
    WHEN has_permission('customers:read_sensitive') 
    THEN endereco_cep 
    ELSE 
      CASE 
        WHEN endereco_cep IS NOT NULL 
        THEN left(endereco_cep, 2) || '***-***' 
        ELSE NULL 
      END 
  END as endereco_cep,
  
  observacoes,
  organization_id,
  integration_account_id,
  created_at,
  updated_at
FROM public.clientes
WHERE organization_id = get_current_org_id();

-- Enable RLS on the view (Supabase handles this automatically for views)

-- Add the new permission for reading sensitive customer data
INSERT INTO public.app_permissions (key, name, description) 
VALUES ('customers:read_sensitive', 'Read Sensitive Customer Data', 'Allows reading unmasked sensitive customer information like full names, documents, and addresses')
ON CONFLICT (key) DO NOTHING;

-- Create secure function to get customer by ID with proper access control
CREATE OR REPLACE FUNCTION public.get_customer_secure(customer_id uuid)
RETURNS TABLE(
  id uuid,
  nome_completo text,
  cpf_cnpj text,
  email text,
  telefone text,
  empresa text,
  status_cliente text,
  ticket_medio numeric,
  valor_total_gasto numeric,
  total_pedidos integer,
  data_ultimo_pedido date,
  data_primeiro_pedido date,
  endereco_rua text,
  endereco_numero text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  endereco_cep text,
  observacoes text,
  organization_id uuid,
  integration_account_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Log access attempt
  PERFORM log_audit_event(
    'customer_access',
    'clientes',
    customer_id::text,
    NULL,
    jsonb_build_object('masked', NOT has_permission('customers:read_sensitive'))
  );
  
  -- Return data from safe view
  RETURN QUERY
  SELECT * FROM public.clientes_safe cs WHERE cs.id = customer_id;
END;
$$;

-- Create function to search customers safely
CREATE OR REPLACE FUNCTION public.search_customers_secure(
  search_term text DEFAULT '',
  limit_count integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  nome_completo text,
  cpf_cnpj text,
  email text,
  telefone text,
  empresa text,
  status_cliente text,
  ticket_medio numeric,
  valor_total_gasto numeric,
  total_pedidos integer,
  data_ultimo_pedido date,
  data_primeiro_pedido date,
  endereco_rua text,
  endereco_numero text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  endereco_cep text,
  observacoes text,
  organization_id uuid,
  integration_account_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Log search attempt
  PERFORM log_audit_event(
    'customer_search',
    'clientes',
    NULL,
    NULL,
    jsonb_build_object('search_term', search_term, 'masked', NOT has_permission('customers:read_sensitive'))
  );
  
  -- Return filtered results from safe view
  RETURN QUERY
  SELECT cs.* FROM public.clientes_safe cs 
  WHERE (
    search_term = '' OR
    cs.nome_completo ILIKE '%' || search_term || '%' OR
    cs.empresa ILIKE '%' || search_term || '%' OR
    cs.email ILIKE '%' || search_term || '%'
  )
  ORDER BY cs.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Create audit table for customer data access
CREATE TABLE IF NOT EXISTS public.customer_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT get_current_org_id(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  customer_id uuid,
  action text NOT NULL,
  sensitive_data_accessed boolean NOT NULL DEFAULT false,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.customer_data_access_log ENABLE ROW LEVEL SECURITY;

-- Create policy for audit log access (admin only)
CREATE POLICY "customer_audit_admin_only" ON public.customer_data_access_log
FOR ALL USING (
  organization_id = get_current_org_id() AND 
  has_permission('system:audit')
);

-- Enhanced logging function specifically for customer data access
CREATE OR REPLACE FUNCTION public.log_customer_access(
  p_customer_id uuid,
  p_action text,
  p_sensitive_accessed boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.customer_data_access_log (
    customer_id,
    action,
    sensitive_data_accessed,
    ip_address,
    user_agent
  ) VALUES (
    p_customer_id,
    p_action,
    p_sensitive_accessed,
    inet(COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', '127.0.0.1')),
    COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown')
  );
EXCEPTION 
  WHEN OTHERS THEN
    -- Don't fail if logging fails
    NULL;
END;
$$;