-- ===================================================================
-- COMPLETE CUSTOMER DATA SECURITY LOCKDOWN - FINAL IMPLEMENTATION
-- ===================================================================
-- This migration implements maximum security by completely blocking 
-- direct access to customer data and forcing all access through secure channels.

-- 1. Drop existing permissive policies that still allow some access
DROP POLICY IF EXISTS "clientes_direct_access_restricted" ON public.clientes;
DROP POLICY IF EXISTS "clientes_admin_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_admin_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_admin_delete" ON public.clientes;

-- 2. Create ABSOLUTE DENY policy - no direct table access allowed
CREATE POLICY "clientes_no_direct_access" ON public.clientes
  FOR ALL USING (false) WITH CHECK (false);

-- 3. Ensure secure functions exist for admin operations
CREATE OR REPLACE FUNCTION public.admin_create_customer(
  p_customer_data jsonb
)
RETURNS TABLE(
  id uuid,
  success boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_manage_permission boolean;
  v_customer_id uuid;
BEGIN
  -- Check permissions
  v_has_manage_permission := has_permission('customers:manage');
  
  IF NOT v_has_manage_permission THEN
    RETURN QUERY SELECT 
      null::uuid as id,
      false as success,
      'Permission denied: customers:manage required'::text as error_message;
    RETURN;
  END IF;
  
  -- Log the operation
  PERFORM log_customer_data_access(null, 'admin_create');
  
  -- Insert customer with explicit organization check
  INSERT INTO public.clientes (
    nome_completo, cpf_cnpj, email, telefone, endereco_rua, endereco_numero,
    endereco_bairro, endereco_cidade, endereco_uf, endereco_cep, observacoes,
    empresa, organization_id
  )
  VALUES (
    p_customer_data->>'nome_completo',
    p_customer_data->>'cpf_cnpj',
    p_customer_data->>'email',
    p_customer_data->>'telefone',
    p_customer_data->>'endereco_rua',
    p_customer_data->>'endereco_numero',
    p_customer_data->>'endereco_bairro',
    p_customer_data->>'endereco_cidade',
    p_customer_data->>'endereco_uf',
    p_customer_data->>'endereco_cep',
    p_customer_data->>'observacoes',
    p_customer_data->>'empresa',
    get_current_org_id()
  ) RETURNING clientes.id INTO v_customer_id;
  
  RETURN QUERY SELECT 
    v_customer_id as id,
    true as success,
    null::text as error_message;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_customer(
  p_customer_id uuid,
  p_updates jsonb
)
RETURNS TABLE(
  success boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_manage_permission boolean;
  v_affected_rows integer;
BEGIN
  -- Check permissions
  v_has_manage_permission := has_permission('customers:manage');
  
  IF NOT v_has_manage_permission THEN
    RETURN QUERY SELECT 
      false as success,
      'Permission denied: customers:manage required'::text as error_message;
    RETURN;
  END IF;
  
  -- Log the operation
  PERFORM log_customer_data_access(p_customer_id, 'admin_update');
  
  -- Update customer with organization check
  UPDATE public.clientes 
  SET 
    nome_completo = COALESCE(p_updates->>'nome_completo', nome_completo),
    cpf_cnpj = COALESCE(p_updates->>'cpf_cnpj', cpf_cnpj),
    email = COALESCE(p_updates->>'email', email),
    telefone = COALESCE(p_updates->>'telefone', telefone),
    endereco_rua = COALESCE(p_updates->>'endereco_rua', endereco_rua),
    endereco_numero = COALESCE(p_updates->>'endereco_numero', endereco_numero),
    endereco_bairro = COALESCE(p_updates->>'endereco_bairro', endereco_bairro),
    endereco_cidade = COALESCE(p_updates->>'endereco_cidade', endereco_cidade),
    endereco_uf = COALESCE(p_updates->>'endereco_uf', endereco_uf),
    endereco_cep = COALESCE(p_updates->>'endereco_cep', endereco_cep),
    observacoes = COALESCE(p_updates->>'observacoes', observacoes),
    empresa = COALESCE(p_updates->>'empresa', empresa),
    updated_at = now()
  WHERE id = p_customer_id 
    AND organization_id = get_current_org_id();
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  IF v_affected_rows = 0 THEN
    RETURN QUERY SELECT 
      false as success,
      'Customer not found or access denied'::text as error_message;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    true as success,
    null::text as error_message;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_customer(
  p_customer_id uuid
)
RETURNS TABLE(
  success boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_manage_permission boolean;
  v_affected_rows integer;
BEGIN
  -- Check permissions
  v_has_manage_permission := has_permission('customers:manage');
  
  IF NOT v_has_manage_permission THEN
    RETURN QUERY SELECT 
      false as success,
      'Permission denied: customers:manage required'::text as error_message;
    RETURN;
  END IF;
  
  -- Log the operation
  PERFORM log_customer_data_access(p_customer_id, 'admin_delete');
  
  -- Delete customer with organization check
  DELETE FROM public.clientes 
  WHERE id = p_customer_id 
    AND organization_id = get_current_org_id();
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  IF v_affected_rows = 0 THEN
    RETURN QUERY SELECT 
      false as success,
      'Customer not found or access denied'::text as error_message;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    true as success,
    null::text as error_message;
END;
$$;

-- 4. Revoke ALL direct permissions and grant only secure access
REVOKE ALL ON public.clientes FROM public;
REVOKE ALL ON public.clientes FROM authenticated;

-- Grant access only to secure functions and views
GRANT SELECT ON public.clientes_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_customers_secure(text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_customer(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_customer(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_customer(uuid) TO authenticated;

-- 5. Update table comment with final security warning
COMMENT ON TABLE public.clientes IS 'MAXIMUM SECURITY: Direct access COMPLETELY BLOCKED. ALL operations must use secure functions. Any direct table access will fail due to RLS deny-all policy.';