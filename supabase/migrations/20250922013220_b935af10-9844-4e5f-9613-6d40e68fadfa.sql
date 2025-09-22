-- ===================================================================
-- SECURITY FIX: Customer Data Protection with Data Masking (Fixed)
-- ===================================================================

-- 1. Drop existing functions that might conflict
DROP FUNCTION IF EXISTS public.get_customer_secure(uuid);
DROP FUNCTION IF EXISTS public.search_customers_secure(text, text, text, text, integer, integer);

-- 2. Create secure view with data masking for clientes table
CREATE OR REPLACE VIEW public.clientes_secure AS
SELECT 
  id,
  -- Mask sensitive personal data based on permissions
  CASE 
    WHEN can_view_sensitive_customer_data() THEN nome_completo
    ELSE CASE 
      WHEN nome_completo IS NULL THEN NULL
      ELSE LEFT(nome_completo, 3) || '***'
    END
  END as nome_completo,
  
  CASE 
    WHEN can_view_sensitive_customer_data() THEN cpf_cnpj
    ELSE mask_cpf_cnpj(cpf_cnpj)
  END as cpf_cnpj,
  
  CASE 
    WHEN can_view_sensitive_customer_data() THEN email
    ELSE mask_email(email)
  END as email,
  
  CASE 
    WHEN can_view_sensitive_customer_data() THEN telefone
    ELSE mask_customer_phone(telefone)
  END as telefone,
  
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_rua
    ELSE mask_customer_address(endereco_rua)
  END as endereco_rua,
  
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_numero
    ELSE CASE 
      WHEN endereco_numero IS NULL THEN NULL
      ELSE '***'
    END
  END as endereco_numero,
  
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_bairro
    ELSE mask_customer_address(endereco_bairro)
  END as endereco_bairro,
  
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_cidade
    ELSE endereco_cidade -- Keep city visible for business operations
  END as endereco_cidade,
  
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_uf
    ELSE endereco_uf -- Keep state visible for business operations
  END as endereco_uf,
  
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_cep
    ELSE mask_customer_cep(endereco_cep)
  END as endereco_cep,
  
  -- Non-sensitive business data (always visible)
  data_primeiro_pedido,
  data_ultimo_pedido,
  total_pedidos,
  valor_total_gasto,
  ticket_medio,
  status_cliente,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN observacoes
    ELSE CASE 
      WHEN observacoes IS NULL THEN NULL
      ELSE 'Observações ocultas'
    END
  END as observacoes,
  empresa,
  integration_account_id,
  organization_id,
  created_at,
  updated_at,
  
  -- Add flag to indicate if data is masked for auditing
  NOT can_view_sensitive_customer_data() as data_is_masked
  
FROM public.clientes;

-- 3. Create secure RPC functions for customer data access
CREATE OR REPLACE FUNCTION public.get_customer_secure(p_customer_id uuid)
RETURNS TABLE(
  id uuid,
  nome_completo text,
  cpf_cnpj text,
  email text,
  telefone text,
  endereco_rua text,
  endereco_numero text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  endereco_cep text,
  data_primeiro_pedido date,
  data_ultimo_pedido date,
  total_pedidos integer,
  valor_total_gasto numeric,
  ticket_medio numeric,
  status_cliente text,
  observacoes text,
  empresa text,
  integration_account_id uuid,
  organization_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  data_is_masked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the access attempt
  PERFORM log_customer_data_access(p_customer_id, 'view_single');
  
  -- Return data from secure view
  RETURN QUERY
  SELECT * FROM public.clientes_secure 
  WHERE clientes_secure.id = p_customer_id 
    AND clientes_secure.organization_id = get_current_org_id();
END;
$$;

CREATE OR REPLACE FUNCTION public.search_customers_secure(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_cidade text DEFAULT NULL,
  p_uf text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  nome_completo text,
  cpf_cnpj text,
  email text,
  telefone text,
  endereco_rua text,
  endereco_numero text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  endereco_cep text,
  data_primeiro_pedido date,
  data_ultimo_pedido date,
  total_pedidos integer,
  valor_total_gasto numeric,
  ticket_medio numeric,
  status_cliente text,
  observacoes text,
  empresa text,
  integration_account_id uuid,
  organization_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  data_is_masked boolean,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the search access
  PERFORM log_customer_data_access(NULL, 'search');
  
  -- Return filtered data from secure view
  RETURN QUERY
  WITH filtered_customers AS (
    SELECT *,
           COUNT(*) OVER() as total_count
    FROM public.clientes_secure 
    WHERE clientes_secure.organization_id = get_current_org_id()
      AND (p_search IS NULL OR (
        clientes_secure.nome_completo ILIKE '%' || p_search || '%' OR
        clientes_secure.email ILIKE '%' || p_search || '%' OR
        clientes_secure.empresa ILIKE '%' || p_search || '%'
      ))
      AND (p_status IS NULL OR clientes_secure.status_cliente = p_status)
      AND (p_cidade IS NULL OR clientes_secure.endereco_cidade ILIKE '%' || p_cidade || '%')
      AND (p_uf IS NULL OR clientes_secure.endereco_uf = p_uf)
    ORDER BY clientes_secure.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT * FROM filtered_customers;
END;
$$;

-- 4. Grant permissions to authenticated users
GRANT SELECT ON public.clientes_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_customers_secure(text, text, text, text, integer, integer) TO authenticated;