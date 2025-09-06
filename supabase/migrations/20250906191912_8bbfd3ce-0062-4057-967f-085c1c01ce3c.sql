-- Enhanced security for clientes table with permission checks and data masking
-- Create safe view for customer data with masked sensitive information

-- Create function to mask customer data based on permissions
CREATE OR REPLACE FUNCTION public.mask_customer_data(
  p_nome_completo text,
  p_cpf_cnpj text,
  p_email text,
  p_telefone text,
  p_endereco_rua text,
  p_endereco_numero text,
  p_endereco_bairro text,
  p_endereco_cidade text,
  p_endereco_uf text,
  p_endereco_cep text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user has permission to view full customer PII
  IF public.has_permission('customers:view_pii') THEN
    RETURN jsonb_build_object(
      'nome_completo', p_nome_completo,
      'cpf_cnpj', p_cpf_cnpj,
      'email', p_email,
      'telefone', p_telefone,
      'endereco_rua', p_endereco_rua,
      'endereco_numero', p_endereco_numero,
      'endereco_bairro', p_endereco_bairro,
      'endereco_cidade', p_endereco_cidade,
      'endereco_uf', p_endereco_uf,
      'endereco_cep', p_endereco_cep
    );
  ELSE
    -- Return masked data for users without PII permissions
    RETURN jsonb_build_object(
      'nome_completo', public.mask_name(p_nome_completo),
      'cpf_cnpj', public.mask_document(p_cpf_cnpj),
      'email', public.mask_email(p_email),
      'telefone', public.mask_phone_secure(p_telefone),
      'endereco_rua', CASE WHEN p_endereco_rua IS NOT NULL THEN '***' ELSE NULL END,
      'endereco_numero', CASE WHEN p_endereco_numero IS NOT NULL THEN '***' ELSE NULL END,
      'endereco_bairro', p_endereco_bairro, -- Keep neighborhood visible for logistics
      'endereco_cidade', p_endereco_cidade, -- Keep city visible for logistics
      'endereco_uf', p_endereco_uf, -- Keep state visible for logistics
      'endereco_cep', CASE WHEN p_endereco_cep IS NOT NULL THEN left(p_endereco_cep, 5) || '-***' ELSE NULL END
    );
  END IF;
END;
$$;

-- Create secure view for customer data
CREATE OR REPLACE VIEW public.clientes_safe AS
SELECT 
  c.id,
  -- Use masking function for sensitive data
  (public.mask_customer_data(
    c.nome_completo, c.cpf_cnpj, c.email, c.telefone,
    c.endereco_rua, c.endereco_numero, c.endereco_bairro,
    c.endereco_cidade, c.endereco_uf, c.endereco_cep
  )->>'nome_completo') as nome_completo,
  (public.mask_customer_data(
    c.nome_completo, c.cpf_cnpj, c.email, c.telefone,
    c.endereco_rua, c.endereco_numero, c.endereco_bairro,
    c.endereco_cidade, c.endereco_uf, c.endereco_cep
  )->>'cpf_cnpj') as cpf_cnpj,
  (public.mask_customer_data(
    c.nome_completo, c.cpf_cnpj, c.email, c.telefone,
    c.endereco_rua, c.endereco_numero, c.endereco_bairro,
    c.endereco_cidade, c.endereco_uf, c.endereco_cep
  )->>'email') as email,
  (public.mask_customer_data(
    c.nome_completo, c.cpf_cnpj, c.email, c.telefone,
    c.endereco_rua, c.endereco_numero, c.endereco_bairro,
    c.endereco_cidade, c.endereco_uf, c.endereco_cep
  )->>'telefone') as telefone,
  (public.mask_customer_data(
    c.nome_completo, c.cpf_cnpj, c.email, c.telefone,
    c.endereco_rua, c.endereco_numero, c.endereco_bairro,
    c.endereco_cidade, c.endereco_uf, c.endereco_cep
  )->>'endereco_rua') as endereco_rua,
  (public.mask_customer_data(
    c.nome_completo, c.cpf_cnpj, c.email, c.telefone,
    c.endereco_rua, c.endereco_numero, c.endereco_bairro,
    c.endereco_cidade, c.endereco_uf, c.endereco_cep
  )->>'endereco_numero') as endereco_numero,
  (public.mask_customer_data(
    c.nome_completo, c.cpf_cnpj, c.email, c.telefone,
    c.endereco_rua, c.endereco_numero, c.endereco_bairro,
    c.endereco_cidade, c.endereco_uf, c.endereco_cep
  )->>'endereco_bairro') as endereco_bairro,
  (public.mask_customer_data(
    c.nome_completo, c.cpf_cnpj, c.email, c.telefone,
    c.endereco_rua, c.endereco_numero, c.endereco_bairro,
    c.endereco_cidade, c.endereco_uf, c.endereco_cep
  )->>'endereco_cidade') as endereco_cidade,
  (public.mask_customer_data(
    c.nome_completo, c.cpf_cnpj, c.email, c.telefone,
    c.endereco_rua, c.endereco_numero, c.endereco_bairro,
    c.endereco_cidade, c.endereco_uf, c.endereco_cep
  )->>'endereco_uf') as endereco_uf,
  (public.mask_customer_data(
    c.nome_completo, c.cpf_cnpj, c.email, c.telefone,
    c.endereco_rua, c.endereco_numero, c.endereco_bairro,
    c.endereco_cidade, c.endereco_uf, c.endereco_cep
  )->>'endereco_cep') as endereco_cep,
  -- Non-sensitive data remains unmasked
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
  c.updated_at
FROM public.clientes c
WHERE c.organization_id = public.get_current_org_id();

-- Enable RLS on the safe view
ALTER VIEW public.clientes_safe SET (security_barrier = true);

-- Update existing RLS policies to include permission checks
DROP POLICY IF EXISTS "clientes_org_select" ON public.clientes;
CREATE POLICY "clientes_org_select_with_perms" ON public.clientes
FOR SELECT USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('customers:read')
);

DROP POLICY IF EXISTS "clientes_org_insert" ON public.clientes;
CREATE POLICY "clientes_org_insert_with_perms" ON public.clientes
FOR INSERT WITH CHECK (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('customers:create')
);

DROP POLICY IF EXISTS "clientes_org_update" ON public.clientes;
CREATE POLICY "clientes_org_update_with_perms" ON public.clientes
FOR UPDATE USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('customers:update')
);

DROP POLICY IF EXISTS "clientes_org_delete" ON public.clientes;
CREATE POLICY "clientes_org_delete_with_perms" ON public.clientes
FOR DELETE USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('customers:delete')
);

-- Ensure the customers permissions exist in app_permissions
INSERT INTO public.app_permissions (key, name, description) VALUES
('customers:read', 'View Customers', 'Allows viewing customer list and basic information'),
('customers:view_pii', 'View Customer PII', 'Allows viewing customer personally identifiable information (full names, documents, contact details)'),
('customers:create', 'Create Customers', 'Allows creating new customer records'),
('customers:update', 'Update Customers', 'Allows modifying existing customer records'),
('customers:delete', 'Delete Customers', 'Allows deleting customer records')
ON CONFLICT (key) DO NOTHING;