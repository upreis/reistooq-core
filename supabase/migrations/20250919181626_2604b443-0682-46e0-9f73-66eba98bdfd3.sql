-- Fix Security Definer View issue by replacing the clientes_secure view with a security definer function
-- This maintains the same functionality while following security best practices

-- First, drop the existing view
DROP VIEW IF EXISTS public.clientes_secure;

-- Create a security definer function to replace the view
CREATE OR REPLACE FUNCTION public.get_clientes_secure()
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
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    c.id,
    c.nome_completo,
    CASE
      WHEN can_view_sensitive_customer_data() THEN c.cpf_cnpj
      ELSE mask_cpf_cnpj(c.cpf_cnpj)
    END AS cpf_cnpj,
    CASE
      WHEN can_view_sensitive_customer_data() THEN c.email
      ELSE mask_email(c.email)
    END AS email,
    CASE
      WHEN can_view_sensitive_customer_data() THEN c.telefone
      ELSE mask_customer_phone(c.telefone)
    END AS telefone,
    CASE
      WHEN can_view_sensitive_customer_data() THEN c.endereco_rua
      ELSE mask_customer_address(c.endereco_rua)
    END AS endereco_rua,
    CASE
      WHEN can_view_sensitive_customer_data() THEN c.endereco_numero
      ELSE mask_customer_address(c.endereco_numero)
    END AS endereco_numero,
    CASE
      WHEN can_view_sensitive_customer_data() THEN c.endereco_bairro
      ELSE mask_customer_address(c.endereco_bairro)
    END AS endereco_bairro,
    c.endereco_cidade,
    c.endereco_uf,
    CASE
      WHEN can_view_sensitive_customer_data() THEN c.endereco_cep
      ELSE mask_customer_cep(c.endereco_cep)
    END AS endereco_cep,
    c.data_primeiro_pedido,
    c.data_ultimo_pedido,
    c.total_pedidos,
    c.valor_total_gasto,
    c.ticket_medio,
    c.status_cliente,
    c.observacoes,
    c.empresa,
    c.integration_account_id,
    c.organization_id,
    c.created_at,
    c.updated_at,
    (NOT can_view_sensitive_customer_data()) AS data_is_masked
  FROM public.clientes c
  WHERE c.organization_id = get_current_org_id() 
    AND has_permission('customers:read'::text) 
    AND auth.uid() IS NOT NULL;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_clientes_secure() TO authenticated;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION public.get_clientes_secure() FROM PUBLIC;