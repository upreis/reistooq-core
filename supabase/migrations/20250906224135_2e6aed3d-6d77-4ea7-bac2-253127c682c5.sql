-- Final security enhancement: Add new permission level for full customer data access
-- This ensures proper separation of access levels

-- Add new permission for full customer data access  
INSERT INTO public.app_permissions (key, name, description) 
VALUES 
  ('customers:read_full', 'Read Full Customer Data', 'Access to all customer personal information including unmasked CPF, email, and phone')
ON CONFLICT (key) DO NOTHING;

-- Update clientes_safe view to be even more secure with better security barrier
DROP VIEW IF EXISTS public.clientes_safe;

CREATE OR REPLACE VIEW public.clientes_safe 
WITH (security_barrier = true, security_invoker = true)
AS
SELECT 
  c.id,
  -- Enhanced data masking with stricter controls
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.nome_completo
    WHEN public.has_permission('customers:read') THEN public.mask_name(c.nome_completo)
    ELSE 'RESTRICTED'
  END as nome_completo,
  
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.cpf_cnpj
    WHEN public.has_permission('customers:read') THEN public.mask_document(c.cpf_cnpj)
    ELSE NULL
  END as cpf_cnpj,
  
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.email
    WHEN public.has_permission('customers:read') THEN public.mask_email(c.email)
    ELSE NULL
  END as email,
  
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.telefone
    WHEN public.has_permission('customers:read') THEN public.mask_phone_secure(c.telefone)
    ELSE NULL
  END as telefone,
  
  -- Address information with proper access control
  CASE 
    WHEN public.has_permission('customers:read') THEN c.endereco_rua
    ELSE NULL
  END as endereco_rua,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.endereco_numero
    ELSE NULL
  END as endereco_numero,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.endereco_bairro
    ELSE NULL
  END as endereco_bairro,
  
  -- City and state for analytics - only with read permission
  CASE 
    WHEN public.has_permission('customers:read') THEN c.endereco_cidade
    ELSE NULL
  END as endereco_cidade,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.endereco_uf
    ELSE NULL
  END as endereco_uf,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.endereco_cep
    ELSE NULL
  END as endereco_cep,
  
  -- Business analytics data - visible to authorized users only
  CASE 
    WHEN public.has_permission('customers:read') THEN c.data_primeiro_pedido
    ELSE NULL
  END as data_primeiro_pedido,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.data_ultimo_pedido
    ELSE NULL
  END as data_ultimo_pedido,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.total_pedidos
    ELSE 0
  END as total_pedidos,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.valor_total_gasto
    ELSE 0
  END as valor_total_gasto,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.ticket_medio
    ELSE 0
  END as ticket_medio,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.status_cliente
    ELSE 'RESTRICTED'
  END as status_cliente,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.observacoes
    ELSE NULL
  END as observacoes,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.empresa
    ELSE NULL
  END as empresa,
  
  c.integration_account_id,
  c.organization_id,
  c.created_at,
  c.updated_at
FROM public.clientes c
WHERE c.organization_id = public.get_current_org_id()
  AND public.has_permission('customers:read');

-- Ensure proper grants for the secure view
GRANT SELECT ON public.clientes_safe TO authenticated;

-- Document the security implementation
COMMENT ON VIEW public.clientes_safe IS 'Secure view for customer data with automatic masking based on user permissions. Uses customers:read for basic access and customers:read_full for unmasked personal data.';