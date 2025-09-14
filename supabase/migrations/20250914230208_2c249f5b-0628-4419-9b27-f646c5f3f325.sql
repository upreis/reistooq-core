-- 🔒 SOLUÇÃO DE SEGURANÇA PARA DADOS SENSÍVEIS DE CLIENTES
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

-- 3. Função de mascaramento de email (já existe mask_email, vamos garantir que existe)
CREATE OR REPLACE FUNCTION public.mask_email(email_addr text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF email_addr IS NULL OR email_addr = '' OR email_addr NOT LIKE '%@%' THEN
    RETURN NULL;
  END IF;
  
  RETURN LEFT(email_addr, 3) || '***@' || SPLIT_PART(email_addr, '@', 2);
END;
$$;

-- 4. Função de mascaramento de CPF/CNPJ (já existe mask_cpf_cnpj, vamos garantir que existe)
CREATE OR REPLACE FUNCTION public.mask_cpf_cnpj(document text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF document IS NULL OR document = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remover caracteres não numéricos
  document := REGEXP_REPLACE(document, '[^0-9]', '', 'g');
  
  IF LENGTH(document) = 11 THEN
    -- CPF: xxx.xxx.xxx-xx
    RETURN '***.***.***-' || RIGHT(document, 2);
  ELSIF LENGTH(document) = 14 THEN
    -- CNPJ: xx.xxx.xxx/xxxx-xx
    RETURN '**.***.***/****-' || RIGHT(document, 2);
  ELSE
    RETURN '****';
  END IF;
END;
$$;

-- 5. Função de mascaramento de telefone
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

-- 6. Função de mascaramento de endereço
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

-- 7. Função de mascaramento de CEP
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

-- 8. Criar view com dados mascarados para usuários sem permissão especial
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
  endereco_cidade, -- Cidade pode ser mostrada
  endereco_uf,     -- UF pode ser mostrada
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
  updated_at
FROM public.clientes;

-- 9. Aplicar RLS na view
ALTER VIEW public.clientes_secure SET (security_barrier = true);

-- 10. Função para log de auditoria de acesso a dados sensíveis
CREATE OR REPLACE FUNCTION public.log_sensitive_customer_access(customer_id uuid, access_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer_data_access_log (
    customer_id,
    user_id,
    action,
    sensitive_data_accessed,
    organization_id
  ) VALUES (
    customer_id,
    auth.uid(),
    access_type,
    can_view_sensitive_customer_data(),
    get_current_org_id()
  );
EXCEPTION WHEN OTHERS THEN
  -- Log silently fails to not break functionality
  NULL;
END;
$$;

-- 11. Trigger para log automático de acesso a dados sensíveis na tabela original
CREATE OR REPLACE FUNCTION public.log_customer_access_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log apenas se o usuário acessou dados sensíveis
  IF can_view_sensitive_customer_data() THEN
    PERFORM log_sensitive_customer_access(NEW.id, 'full_access');
  ELSE
    PERFORM log_sensitive_customer_access(NEW.id, 'masked_access');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 12. Aplicar trigger na tabela clientes
DROP TRIGGER IF EXISTS clientes_access_audit ON public.clientes;
CREATE TRIGGER clientes_access_audit
  AFTER SELECT ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_customer_access_trigger();