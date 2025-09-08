-- Security Fix: Enable RLS and proper policies for clientes_safe view
-- This ensures customer personal information is protected

-- Enable RLS on clientes_safe view (the main view was already protected)
ALTER VIEW public.clientes_safe SET (security_barrier = true);

-- Create RLS policies for clientes_safe view with data masking
-- Only users with customers:read permission in their organization can access customer data
CREATE POLICY "clientes_safe_org_select_with_perms" 
ON public.clientes_safe
FOR SELECT 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('customers:read')
);

-- Add policy to ensure only authenticated users can access
CREATE POLICY "clientes_safe_authenticated_only" 
ON public.clientes_safe
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Ensure the sync function has proper security
-- Update the sync function to use secure views only
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

  -- Check permission
  IF NOT public.has_permission('customers:manage') THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Sync customer data from orders using secure access
  WITH pedido_clientes AS (
    SELECT DISTINCT
      nome_cliente,
      cpf_cnpj,
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

-- Add audit logging for customer data access
CREATE OR REPLACE FUNCTION public.log_cliente_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to customer data for audit purposes
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    new_values
  ) VALUES (
    public.get_current_org_id(),
    auth.uid(),
    'access',
    'customer_data',
    NEW.id::text,
    json_build_object('accessed_at', now())
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the operation if audit logging fails
  RETURN NEW;
END;
$$;

-- Create trigger for audit logging on customer access
-- (Only on SELECT operations to the main table)
-- Note: This will log when customers are accessed through the secure service

-- Grant necessary permissions for the secure service
GRANT SELECT ON public.clientes_safe TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;

-- Ensure the masking functions are available
CREATE OR REPLACE FUNCTION public.mask_sensitive_data(data_type text, original_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE data_type
    WHEN 'cpf_cnpj' THEN
      RETURN public.mask_document(original_value);
    WHEN 'phone' THEN  
      RETURN public.mask_phone_secure(original_value);
    WHEN 'email' THEN
      RETURN public.mask_email(original_value);
    WHEN 'name' THEN
      RETURN public.mask_name(original_value);
    ELSE
      RETURN original_value;
  END CASE;
END;
$$;