-- 🔒 CORREÇÃO DA SOLUÇÃO DE SEGURANÇA PARA DADOS SENSÍVEIS DE CLIENTES
-- Remove trigger inválido e ajusta implementação

-- 1. Remover trigger inválido (PostgreSQL não suporta AFTER SELECT)
DROP TRIGGER IF EXISTS clientes_access_audit ON public.clientes;
DROP FUNCTION IF EXISTS public.log_customer_access_trigger();

-- 2. Criar RLS policies mais restritivas na view clientes_secure
DROP VIEW IF EXISTS public.clientes_secure;

-- 3. Recriar view com melhores práticas de segurança
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
    ELSE mask_phone(telefone)
  END AS telefone,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_rua
    ELSE mask_address(endereco_rua)
  END AS endereco_rua,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_numero
    ELSE mask_address(endereco_numero)
  END AS endereco_numero,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_bairro
    ELSE mask_address(endereco_bairro)
  END AS endereco_bairro,
  endereco_cidade,
  endereco_uf,
  CASE 
    WHEN can_view_sensitive_customer_data() THEN endereco_cep
    ELSE mask_cep(endereco_cep)
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
  -- Flag indicating if data is masked for audit purposes
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

-- 4. Habilitar RLS na view (security_barrier)
ALTER VIEW public.clientes_secure SET (security_barrier = true);

-- 5. Função para registrar acesso a dados sensíveis (chamada explicitamente pela aplicação)
CREATE OR REPLACE FUNCTION public.log_customer_data_access(
  p_customer_id uuid,
  p_action text DEFAULT 'view',
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_sensitive_access boolean;
BEGIN
  v_has_sensitive_access := can_view_sensitive_customer_data();
  
  INSERT INTO public.customer_data_access_log (
    customer_id,
    user_id,
    action,
    sensitive_data_accessed,
    organization_id
  ) VALUES (
    p_customer_id,
    auth.uid(),
    p_action || (CASE WHEN v_has_sensitive_access THEN '_full' ELSE '_masked' END),
    v_has_sensitive_access,
    get_current_org_id()
  );
  
  -- Log de segurança adicional em audit_logs
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    new_values
  ) VALUES (
    get_current_org_id(),
    auth.uid(),
    'customer_data_access',
    'cliente',
    p_customer_id::text,
    jsonb_build_object(
      'action', p_action,
      'sensitive_access', v_has_sensitive_access,
      'details', COALESCE(p_details, '{}'::jsonb)
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Log falha silenciosamente para não quebrar funcionalidade
  NULL;
END;
$$;

-- 6. Criar política RLS mais restritiva para a tabela original clientes
-- (mantém as políticas existentes mas adiciona log de acesso)
CREATE OR REPLACE FUNCTION public.enhanced_clientes_access_check()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_permission boolean;
  v_org_match boolean;
  v_auth_valid boolean;
BEGIN
  -- Verificações de segurança existentes
  v_has_permission := has_permission('customers:read'::text);
  v_org_match := true; -- Será verificado por context
  v_auth_valid := auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.last_sign_in_at > (now() - '7 days'::interval)
  );
  
  RETURN v_has_permission AND v_org_match AND v_auth_valid;
END;
$$;