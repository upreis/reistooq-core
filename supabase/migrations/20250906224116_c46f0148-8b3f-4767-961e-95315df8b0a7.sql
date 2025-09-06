-- Security Fix: Update clientes_safe view with proper data masking and security
-- This ensures customer personal information is protected with automatic masking

-- Drop and recreate the clientes_safe view with proper security and data masking
DROP VIEW IF EXISTS public.clientes_safe;

-- Create secure view with automatic data masking based on user permissions
CREATE OR REPLACE VIEW public.clientes_safe 
WITH (security_barrier = true, security_invoker = true)
AS
SELECT 
  c.id,
  -- Mask sensitive data based on user permissions
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.nome_completo
    ELSE public.mask_name(c.nome_completo)
  END as nome_completo,
  
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.cpf_cnpj
    ELSE public.mask_document(c.cpf_cnpj)
  END as cpf_cnpj,
  
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.email
    ELSE public.mask_email(c.email)
  END as email,
  
  CASE 
    WHEN public.has_permission('customers:read_full') THEN c.telefone
    ELSE public.mask_phone_secure(c.telefone)
  END as telefone,
  
  -- Address fields - less sensitive, show to users with customers:read
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
  
  -- Always show city and state for basic analytics
  c.endereco_cidade,
  c.endereco_uf,
  
  CASE 
    WHEN public.has_permission('customers:read') THEN c.endereco_cep
    ELSE NULL
  END as endereco_cep,
  
  -- Business data - always visible to authorized users
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
WHERE c.organization_id = public.get_current_org_id()
  AND public.has_permission('customers:read');

-- Grant access to the safe view
GRANT SELECT ON public.clientes_safe TO authenticated;

-- Update the sync function to require proper permissions
CREATE OR REPLACE FUNCTION public.sync_cliente_from_pedido()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
  updated_count integer := 0;
  result json;
BEGIN
  -- Get current organization
  org_id := public.get_current_org_id();
  IF org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organization not found');
  END IF;

  -- Check permission - only users who can manage customers can sync
  IF NOT public.has_permission('customers:create') THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions to sync customers');
  END IF;

  -- Sync customer data from orders with proper organization filtering
  WITH pedido_clientes AS (
    SELECT DISTINCT
      p.nome_cliente,
      p.cpf_cnpj,
      ia.organization_id
    FROM public.pedidos p
    JOIN public.integration_accounts ia ON ia.id = p.integration_account_id
    WHERE ia.organization_id = org_id
      AND p.nome_cliente IS NOT NULL
      AND trim(p.nome_cliente) != ''
  )
  INSERT INTO public.clientes (
    nome_completo,
    cpf_cnpj,
    organization_id,
    total_pedidos,
    status_cliente
  )
  SELECT 
    pc.nome_cliente,
    pc.cpf_cnpj,
    pc.organization_id,
    1,
    'Regular'
  FROM pedido_clientes pc
  WHERE NOT EXISTS (
    SELECT 1 FROM public.clientes c 
    WHERE c.nome_completo = pc.nome_cliente 
      AND c.organization_id = pc.organization_id
      AND (c.cpf_cnpj = pc.cpf_cnpj OR (c.cpf_cnpj IS NULL AND pc.cpf_cnpj IS NULL))
  );

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Log the sync operation for audit
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    new_values
  ) VALUES (
    org_id,
    auth.uid(),
    'sync',
    'customers',
    'bulk_sync',
    json_build_object('synced_count', updated_count, 'timestamp', now())
  );

  RETURN json_build_object(
    'success', true,
    'synced_customers', updated_count,
    'organization_id', org_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;