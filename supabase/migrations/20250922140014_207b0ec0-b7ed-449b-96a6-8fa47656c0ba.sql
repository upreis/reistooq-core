-- ===================================================================
-- SECURE CLIENTES_SECURE VIEW: Add Access Controls (Fixed)
-- ===================================================================

-- Create a security function for access control
CREATE OR REPLACE FUNCTION public.check_clientes_secure_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL 
    AND get_current_org_id() IS NOT NULL
    AND has_permission('customers:read');
$$;

-- Drop and recreate the view with proper security
DROP VIEW IF EXISTS public.clientes_secure;

CREATE VIEW public.clientes_secure 
WITH (security_invoker = true) AS
SELECT 
  id,
  -- Apply masking and access controls
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
    ELSE endereco_cidade
  END as endereco_cidade,
  
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_uf
    ELSE endereco_uf
  END as endereco_uf,
  
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_cep
    ELSE mask_customer_cep(endereco_cep)
  END as endereco_cep,
  
  -- Business data (always visible to authorized users)
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
      ELSE 'Observações protegidas'
    END
  END as observacoes,
  
  empresa,
  integration_account_id,
  organization_id,
  created_at,
  updated_at,
  
  -- Security flag
  NOT can_view_sensitive_customer_data() as data_is_masked
  
FROM public.clientes
WHERE check_clientes_secure_access() 
  AND organization_id = get_current_org_id();

-- Revoke public access and grant only to authenticated users
REVOKE ALL ON public.clientes_secure FROM public;
GRANT SELECT ON public.clientes_secure TO authenticated;

-- Add security documentation
COMMENT ON VIEW public.clientes_secure IS 'SECURITY PROTECTED: Access requires customers:read permission and organization membership. Sensitive data requires customers:view_sensitive permission. Unauthorized access returns empty result set.';

COMMENT ON FUNCTION public.check_clientes_secure_access() IS 'Security function that validates user access to customer data based on authentication, organization membership, and permissions.';