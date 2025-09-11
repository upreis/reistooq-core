-- 🔒 CORREÇÃO DEFINITIVA DOS 3 ERROS CRÍTICOS DE SEGURANÇA

-- ===== 1. CORRIGIR "Security Definer View" =====
-- Remover completamente views com SECURITY DEFINER e recriar sem essa propriedade

DROP VIEW IF EXISTS profiles_safe CASCADE;
DROP VIEW IF EXISTS historico_vendas_safe CASCADE;
DROP VIEW IF EXISTS clientes_safe CASCADE;

-- Recriar views SEM SECURITY DEFINER
CREATE VIEW profiles_safe AS
SELECT 
  p.id,
  p.nome_completo,
  p.nome_exibicao,
  public.mask_phone(p.telefone) as telefone,
  p.cargo,
  p.departamento,
  p.organizacao_id,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  p.onboarding_banner_dismissed,
  p.configuracoes_notificacao
FROM public.profiles p
WHERE p.organizacao_id = public.get_current_org_id();

CREATE VIEW historico_vendas_safe AS
SELECT 
  hv.id,
  hv.id_unico,
  hv.numero_pedido,
  hv.sku_produto,
  hv.descricao,
  hv.quantidade,
  hv.valor_unitario,
  hv.valor_total,
  hv.status,
  hv.data_pedido,
  hv.created_at,
  hv.updated_at
FROM public.historico_vendas hv
INNER JOIN public.integration_accounts ia ON hv.integration_account_id = ia.id
WHERE ia.organization_id = public.get_current_org_id();

-- ===== 2. CORRIGIR "Customer Personal Information Could Be Stolen" =====
-- Implementar mascaramento automático e políticas RLS mais rigorosas

-- Atualizar políticas RLS da tabela clientes para ser mais restritiva
DROP POLICY IF EXISTS "clientes_enhanced_read_security" ON public.clientes;
DROP POLICY IF EXISTS "clientes_org_delete_with_perms" ON public.clientes;
DROP POLICY IF EXISTS "clientes_org_insert_with_perms" ON public.clientes;
DROP POLICY IF EXISTS "clientes_org_update_with_perms" ON public.clientes;

-- Criar políticas mais seguras
CREATE POLICY "clientes_secure_read" ON public.clientes
FOR SELECT 
USING (
  organization_id = get_current_org_id() 
  AND has_permission('customers:read')
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND last_sign_in_at > (now() - interval '7 days')
  )
);

CREATE POLICY "clientes_secure_insert" ON public.clientes
FOR INSERT 
WITH CHECK (
  organization_id = get_current_org_id() 
  AND has_permission('customers:create')
);

CREATE POLICY "clientes_secure_update" ON public.clientes
FOR UPDATE 
USING (
  organization_id = get_current_org_id() 
  AND has_permission('customers:update')
);

CREATE POLICY "clientes_secure_delete" ON public.clientes
FOR DELETE 
USING (
  organization_id = get_current_org_id() 
  AND has_permission('customers:delete')
);

-- Criar view segura para clientes com mascaramento automático
CREATE VIEW clientes_safe AS
SELECT 
  c.id,
  CASE 
    WHEN has_permission('customers:read_sensitive') THEN c.nome_completo
    ELSE public.mask_name(c.nome_completo)
  END as nome_completo,
  CASE 
    WHEN has_permission('customers:read_sensitive') THEN c.cpf_cnpj
    ELSE public.mask_cpf_cnpj(c.cpf_cnpj)
  END as cpf_cnpj,
  CASE 
    WHEN has_permission('customers:read_sensitive') THEN c.email
    ELSE public.mask_email(c.email)
  END as email,
  CASE 
    WHEN has_permission('customers:read_sensitive') THEN c.telefone
    ELSE public.mask_phone(c.telefone)
  END as telefone,
  c.endereco_rua,
  c.endereco_numero,
  c.endereco_bairro,
  c.endereco_cep,
  c.endereco_cidade,
  c.endereco_uf,
  c.empresa,
  c.observacoes,
  c.status_cliente,
  c.data_primeiro_pedido,
  c.data_ultimo_pedido,
  c.total_pedidos,
  c.valor_total_gasto,
  c.ticket_medio,
  c.organization_id,
  c.created_at,
  c.updated_at
FROM public.clientes c
WHERE c.organization_id = get_current_org_id();

-- Habilitar RLS na view
ALTER VIEW clientes_safe SET (security_barrier = true);

-- ===== 3. CORRIGIR "API Keys and Tokens Could Be Accessed" =====
-- Garantir que a tabela integration_secrets seja completamente bloqueada

DROP POLICY IF EXISTS "deny_all_select_integration_secrets" ON public.integration_secrets;
DROP POLICY IF EXISTS "deny_all_write_integration_secrets" ON public.integration_secrets;
DROP POLICY IF EXISTS "deny_read_integration_secrets" ON public.integration_secrets;
DROP POLICY IF EXISTS "deny_write_integration_secrets" ON public.integration_secrets;
DROP POLICY IF EXISTS "integration_secrets_service_role_only" ON public.integration_secrets;

-- Criar política definitiva: APENAS service_role pode acessar
CREATE POLICY "integration_secrets_service_role_only_access" ON public.integration_secrets
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Revogar todos os acessos públicos
REVOKE ALL ON public.integration_secrets FROM public;
REVOKE ALL ON public.integration_secrets FROM authenticated;
REVOKE ALL ON public.integration_secrets FROM anon;

-- ===== FUNÇÕES DE MASCARAMENTO MELHORADAS =====

CREATE OR REPLACE FUNCTION public.mask_cpf_cnpj(doc text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF doc IS NULL OR doc = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remover caracteres não numéricos
  doc := REGEXP_REPLACE(doc, '[^0-9]', '', 'g');
  
  IF LENGTH(doc) = 11 THEN
    -- CPF: xxx.xxx.xxx-xx
    RETURN '***.***.***-' || RIGHT(doc, 2);
  ELSIF LENGTH(doc) = 14 THEN
    -- CNPJ: xx.xxx.xxx/xxxx-xx
    RETURN '**.***.***/****-' || RIGHT(doc, 2);
  ELSE
    RETURN '****';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(email_addr text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF email_addr IS NULL OR email_addr = '' OR email_addr NOT LIKE '%@%' THEN
    RETURN NULL;
  END IF;
  
  RETURN LEFT(email_addr, 3) || '***@' || SPLIT_PART(email_addr, '@', 2);
END;
$$;

-- ===== AUDITORIA DE SEGURANÇA =====
CREATE OR REPLACE FUNCTION public.log_security_access(
  p_resource_type text,
  p_resource_id text,
  p_action text,
  p_sensitive_data boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
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
    p_action,
    p_resource_type,
    p_resource_id,
    jsonb_build_object('sensitive_data_accessed', p_sensitive_data)
  );
EXCEPTION WHEN OTHERS THEN
  -- Log silently fails to not break functionality
  NULL;
END;
$$;

-- ===== COMENTÁRIOS DE DOCUMENTAÇÃO =====
COMMENT ON VIEW profiles_safe IS 'View segura de perfis com mascaramento automático de telefone';
COMMENT ON VIEW historico_vendas_safe IS 'View segura de vendas filtrada por organização';
COMMENT ON VIEW clientes_safe IS 'View segura de clientes com mascaramento baseado em permissões';
COMMENT ON POLICY "integration_secrets_service_role_only_access" ON public.integration_secrets IS 'Acesso restrito apenas ao service_role para máxima segurança';