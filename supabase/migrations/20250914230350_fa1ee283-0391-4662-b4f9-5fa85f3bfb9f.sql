-- 🔒 SOLUÇÃO COMPLETA DE SEGURANÇA PARA DADOS SENSÍVEIS DE CLIENTES
-- Implementa mascaramento de dados e permissões granulares

-- 1. Criar nova permissão para acessar dados sensíveis não mascarados
INSERT INTO public.app_permissions (key, name, description) VALUES
('customers:view_sensitive', 'Ver Dados Sensíveis de Clientes', 'Permite visualizar CPF/CNPJ, email, telefone e endereço completos dos clientes')
ON CONFLICT (key) DO NOTHING;

-- 2. Função para verificar se usuário pode ver dados sensíveis
CREATE OR REPLACE FUNCTION public.can_view_sensitive_customer_data()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_permission('customers:view_sensitive'::text);
$$;

-- 3. Funções de mascaramento de dados
CREATE OR REPLACE FUNCTION public.mask_phone(phone text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF phone IS NULL OR phone = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remover caracteres não numéricos
  phone := REGEXP_REPLACE(phone, '[^0-9]', '', 'g');
  
  IF LENGTH(phone) >= 8 THEN
    RETURN '****-' || RIGHT(phone, 4);
  ELSE
    RETURN '****';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_address(address text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF address IS NULL OR address = '' THEN
    RETURN NULL;
  END IF;
  
  -- Mostrar apenas as primeiras 3 letras + ***
  IF LENGTH(address) > 3 THEN
    RETURN LEFT(address, 3) || '***';
  ELSE
    RETURN '***';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_cep(cep text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF cep IS NULL OR cep = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remover caracteres não numéricos
  cep := REGEXP_REPLACE(cep, '[^0-9]', '', 'g');
  
  IF LENGTH(cep) = 8 THEN
    RETURN LEFT(cep, 2) || '***-***';
  ELSE
    RETURN '***';
  END IF;
END;
$$;

-- 4. Criar view segura com dados mascarados
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
  -- Flag indicando se os dados estão mascarados
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

-- 5. Habilitar security barrier na view
ALTER VIEW public.clientes_secure SET (security_barrier = true);

-- 6. Função para registrar acesso a dados sensíveis
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
  
  -- Log no sistema de auditoria de clientes
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
  
  -- Log no sistema geral de auditoria
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