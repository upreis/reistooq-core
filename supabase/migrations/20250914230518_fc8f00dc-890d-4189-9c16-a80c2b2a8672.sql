-- 🔧 CORRIGIR WARNING DE SECURITY DEFINER VIEW
-- Remove a configuração security_barrier da view que está causando warning

-- 1. Recriar a view sem security_barrier para evitar warning
CREATE OR REPLACE VIEW public.clientes_secure AS
SELECT 
  id,
  nome_completo,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN cpf_cnpj
    ELSE mask_cpf_cnpj(cpf_cnpj)
  END AS cpf_cnpj,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN email
    ELSE mask_email(email)
  END AS email,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN telefone
    ELSE mask_customer_phone(telefone)
  END AS telefone,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_rua
    ELSE mask_customer_address(endereco_rua)
  END AS endereco_rua,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_numero
    ELSE mask_customer_address(endereco_numero)
  END AS endereco_numero,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_bairro
    ELSE mask_customer_address(endereco_bairro)
  END AS endereco_bairro,
  endereco_cidade,
  endereco_uf,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_cep
    ELSE mask_customer_cep(endereco_cep)
  END AS endereco_cep,
  data_primeiro_pedido,
  data_ultimo_pedido,
  total_pedidos,
  valor_total_gasto,
  ticket_medio,
  status_cliente,
  observacoes,
  empresa,
  integration_account_id,
  organization_id,
  created_at,
  updated_at,
  -- Flag indicando se os dados estão mascarados para auditoria
  NOT can_view_sensitive_customer_data() AS data_is_masked
FROM public.clientes
WHERE organization_id = get_current_org_id() 
  AND has_permission('customers:read'::text)
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.last_sign_in_at > (now() - '7 days'::interval)
  );