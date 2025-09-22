-- ===================================================================
-- SECURE CLIENTES_SECURE VIEW: Add RLS Protection (Fixed)
-- ===================================================================

-- Create a security function that the view can use
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

-- Update the view to include security check and return NULL for unauthorized access
CREATE OR REPLACE VIEW public.clientes_secure 
WITH (security_invoker = true) AS
SELECT 
  CASE WHEN check_clientes_secure_access() THEN id ELSE NULL END as id,
  
  -- Only return data if user has proper access
  CASE 
    WHEN NOT check_clientes_secure_access() THEN NULL
    WHEN can_view_sensitive_customer_data() THEN nome_completo
    ELSE CASE 
      WHEN nome_completo IS NULL THEN NULL
      ELSE LEFT(nome_completo, 3) || '***'
    END
  END as nome_completo,
  
  CASE 
    WHEN NOT check_clientes_secure_access() THEN NULL
    WHEN can_view_sensitive_customer_data() THEN cpf_cnpj
    ELSE mask_cpf_cnpj(cpf_cnpj)
  END as cpf_cnpj,
  
  CASE 
    WHEN NOT check_clientes_secure_access() THEN NULL
    WHEN can_view_sensitive_customer_data() THEN email
    ELSE mask_email(email)
  END as email,
  
  CASE 
    WHEN NOT check_clientes_secure_access() THEN NULL
    WHEN can_view_sensitive_customer_data() THEN telefone
    ELSE mask_customer_phone(telefone)
  END as telefone,
  
  CASE 
    WHEN NOT check_clientes_secure_access() THEN NULL
    WHEN can_view_sensitive_customer_data() THEN endereco_rua
    ELSE mask_customer_address(endereco_rua)
  END as endereco_rua,
  
  CASE 
    WHEN NOT check_clientes_secure_access() THEN NULL
    WHEN can_view_sensitive_customer_data() THEN endereco_numero
    ELSE CASE 
      WHEN endereco_numero IS NULL THEN NULL
      ELSE '***'
    END
  END as endereco_numero,
  
  CASE 
    WHEN NOT check_clientes_secure_access() THEN NULL
    WHEN can_view_sensitive_customer_data() THEN endereco_bairro
    ELSE mask_customer_address(endereco_bairro)
  END as endereco_bairro,
  
  CASE 
    WHEN NOT check_clientes_secure_access() THEN NULL
    WHEN can_view_sensitive_customer_data() THEN endereco_cidade
    ELSE endereco_cidade -- Keep city visible for business operations
  END as endereco_cidade,
  
  CASE 
    WHEN NOT check_clientes_secure_access() THEN NULL
    WHEN can_view_sensitive_customer_data() THEN endereco_uf
    ELSE endereco_uf -- Keep state visible for business operations
  END as endereco_uf,
  
  CASE 
    WHEN NOT check_clientes_secure_access() THEN NULL
    WHEN can_view_sensitive_customer_data() THEN endereco_cep
    ELSE mask_customer_cep(endereco_cep)
  END as endereco_cep,
  
  -- Non-sensitive business data (visible if user has access)
  CASE WHEN check_clientes_secure_access() THEN data_primeiro_pedido ELSE NULL END as data_primeiro_pedido,
  CASE WHEN check_clientes_secure_access() THEN data_ultimo_pedido ELSE NULL END as data_ultimo_pedido,
  CASE WHEN check_clientes_secure_access() THEN total_pedidos ELSE NULL END as total_pedidos,
  CASE WHEN check_clientes_secure_access() THEN valor_total_gasto ELSE NULL END as valor_total_gasto,
  CASE WHEN check_clientes_secure_access() THEN ticket_medio ELSE NULL END as ticket_medio,
  CASE WHEN check_clientes_secure_access() THEN status_cliente ELSE NULL END as status_cliente,
  
  CASE 
    WHEN NOT check_clientes_secure_access() THEN NULL
    WHEN can_view_sensitive_customer_data() THEN observacoes
    ELSE CASE 
      WHEN observacoes IS NULL THEN NULL
      ELSE 'Observações protegidas'
    END
  END as observacoes,
  
  CASE WHEN check_clientes_secure_access() THEN empresa ELSE NULL END as empresa,
  CASE WHEN check_clientes_secure_access() THEN integration_account_id ELSE NULL END as integration_account_id,
  CASE WHEN check_clientes_secure_access() THEN organization_id ELSE NULL END as organization_id,
  CASE WHEN check_clientes_secure_access() THEN created_at ELSE NULL END as created_at,
  CASE WHEN check_clientes_secure_access() THEN updated_at ELSE NULL END as updated_at,
  
  -- Add flag to indicate if data is masked for auditing
  CASE 
    WHEN NOT check_clientes_secure_access() THEN true
    ELSE NOT can_view_sensitive_customer_data()
  END as data_is_masked
  
FROM public.clientes
WHERE check_clientes_secure_access() -- Only return rows if user has access
  AND organization_id = get_current_org_id(); -- Organization filter

-- Revoke public access to clientes_secure and grant only to authenticated users
REVOKE ALL ON public.clientes_secure FROM public;
GRANT SELECT ON public.clientes_secure TO authenticated;

-- Add security comment
COMMENT ON VIEW public.clientes_secure IS 'SECURITY: Protected view with automatic data masking and access controls. Access requires customers:read permission and organization membership. Sensitive data requires customers:view_sensitive permission.';