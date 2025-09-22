-- ===================================================================
-- SECURITY FIX: Convert Security Definer View to Security Invoker
-- ===================================================================
-- This migration fixes the Security Definer View issue by recreating
-- the view with SECURITY INVOKER to properly respect user RLS policies.

-- 1. Drop the existing view that has Security Definer behavior
DROP VIEW IF EXISTS public.clientes_secure;

-- 2. Recreate the view with explicit SECURITY INVOKER
-- This ensures that the view respects the RLS policies of the querying user
-- instead of the view creator's permissions
CREATE VIEW public.clientes_secure 
WITH (security_invoker = true) AS
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

-- 3. Re-grant permissions to authenticated users
GRANT SELECT ON public.clientes_secure TO authenticated;

-- 4. Verify the view is now using security_invoker
-- This query will help confirm the fix (for documentation purposes)
-- SELECT schemaname, viewname, viewowner FROM pg_views WHERE viewname = 'clientes_secure';