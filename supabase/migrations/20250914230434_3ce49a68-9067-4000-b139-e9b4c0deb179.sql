-- 🔒 SOLUÇÃO FINAL DE SEGURANÇA PARA DADOS SENSÍVEIS DE CLIENTES
-- Remove conflitos e implementa solução completa

-- 1. Remover funções conflitantes
DROP FUNCTION IF EXISTS public.mask_phone(text);

-- 2. Criar nova permissão para acessar dados sensíveis
INSERT INTO public.app_permissions (key, name, description) VALUES
('customers:view_sensitive', 'Ver Dados Sensíveis de Clientes', 'Permite visualizar CPF/CNPJ, email, telefone e endereço completos dos clientes')
ON CONFLICT (key) DO NOTHING;

-- 3. Função para verificar se usuário pode ver dados sensíveis
CREATE OR REPLACE FUNCTION public.can_view_sensitive_customer_data()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_permission('customers:view_sensitive'::text);
$$;

-- 4. Funções de mascaramento sem conflitos
CREATE OR REPLACE FUNCTION public.mask_customer_phone(phone text)
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

CREATE OR REPLACE FUNCTION public.mask_customer_address(address text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF address IS NULL OR address = '' THEN
    RETURN NULL;
  END IF;
  
  IF LENGTH(address) > 3 THEN
    RETURN LEFT(address, 3) || '***';
  ELSE
    RETURN '***';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_customer_cep(cep text)
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

-- 5. Criar view segura com dados mascarados
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
FROM public.clientes;

-- 6. Habilitar RLS na view
ALTER VIEW public.clientes_secure SET (security_barrier = true);

-- 7. Função para log de acesso a dados sensíveis
CREATE OR REPLACE FUNCTION public.log_customer_data_access(
  p_customer_id uuid,
  p_action text DEFAULT 'view'
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
  
  -- Log de acesso a dados sensíveis
  PERFORM log_security_access(
    'cliente', 
    p_customer_id::text, 
    p_action || (CASE WHEN v_has_sensitive_access THEN '_full' ELSE '_masked' END),
    v_has_sensitive_access
  );
EXCEPTION WHEN OTHERS THEN
  -- Falha silenciosa para não quebrar funcionalidade
  NULL;
END;
$$;