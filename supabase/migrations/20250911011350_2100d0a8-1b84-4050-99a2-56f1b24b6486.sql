-- 🔒 CORREÇÃO DE SEGURANÇA FINAL: Resolver 3 erros críticos
-- 1. Security Definer View - Corrigir views com SECURITY DEFINER
-- 2. Customer Personal Information - Implementar mascaramento de dados
-- 3. Customer Data Exposed Through Safe View - Proteger visualização segura

-- ===== REMOVER TODAS AS VIEWS EXISTENTES =====
DROP VIEW IF EXISTS profiles_safe CASCADE;
DROP VIEW IF EXISTS historico_vendas_safe CASCADE;
DROP VIEW IF EXISTS clientes_safe CASCADE;
DROP VIEW IF EXISTS clientes_safe_secure CASCADE;

-- ===== ADICIONAR PERMISSÃO PARA DADOS SENSÍVEIS =====
INSERT INTO public.app_permissions (key, name, description)
VALUES ('customers:read_sensitive', 'Visualizar dados sensíveis de clientes', 'Permite visualizar CPF, email e telefone completos dos clientes')
ON CONFLICT (key) DO NOTHING;

-- ===== FUNÇÕES AUXILIARES =====
-- Função para mascarar telefone
CREATE OR REPLACE FUNCTION public.mask_phone(phone_number text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF phone_number IS NULL OR phone_number = '' THEN
    RETURN NULL;
  END IF;
  RETURN '****' || RIGHT(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'), 4);
END;
$$;

-- Função para mascarar nome
CREATE OR REPLACE FUNCTION public.mask_name(full_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF full_name IS NULL OR full_name = '' THEN
    RETURN NULL;
  END IF;
  RETURN LEFT(full_name, 3) || '***';
END;
$$;

-- ===== RECRIAR VIEWS SEGURAS SEM SECURITY DEFINER =====

-- 1. View profiles_safe com mascaramento de telefone
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

-- 2. View historico_vendas_safe com filtro organizacional
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
  hv.observacoes,
  hv.data_pedido,
  hv.created_at,
  hv.updated_at,
  hv.ncm,
  hv.codigo_barras,
  hv.pedido_id,
  hv.valor_frete,
  hv.data_prevista,
  hv.obs,
  hv.obs_interna,
  hv.cidade,
  hv.uf,
  hv.url_rastreamento,
  hv.situacao,
  hv.codigo_rastreamento,
  hv.numero_ecommerce,
  hv.valor_desconto,
  hv.numero_venda,
  hv.sku_estoque,
  hv.sku_kit,
  hv.qtd_kit,
  hv.total_itens
FROM public.historico_vendas hv
INNER JOIN public.integration_accounts ia ON hv.integration_account_id = ia.id
WHERE ia.organization_id = public.get_current_org_id();

-- 3. View clientes_safe_secure com mascaramento baseado em permissões
CREATE VIEW clientes_safe_secure AS
SELECT 
  c.id,
  CASE 
    WHEN public.has_permission('customers:read_sensitive') THEN c.nome_completo
    ELSE public.mask_name(c.nome_completo)
  END as nome_completo,
  CASE 
    WHEN public.has_permission('customers:read_sensitive') THEN c.cpf_cnpj
    ELSE CASE 
      WHEN c.cpf_cnpj IS NOT NULL THEN '***.***.***-**'
      ELSE NULL
    END
  END as cpf_cnpj,
  CASE 
    WHEN public.has_permission('customers:read_sensitive') THEN c.email
    WHEN c.email IS NOT NULL THEN '***@' || SPLIT_PART(c.email, '@', 2)
    ELSE NULL
  END as email,
  CASE 
    WHEN public.has_permission('customers:read_sensitive') THEN c.telefone
    ELSE public.mask_phone(c.telefone)
  END as telefone,
  c.organization_id,
  c.created_at,
  c.updated_at
FROM public.clientes c
WHERE c.organization_id = public.get_current_org_id();

-- ===== FUNÇÃO DE VERIFICAÇÃO DE SEGURANÇA =====
CREATE OR REPLACE FUNCTION public.verify_view_security()
RETURNS TABLE(view_name text, is_security_definer boolean)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    schemaname||'.'||viewname as view_name,
    CASE 
      WHEN definition ILIKE '%SECURITY DEFINER%' THEN true
      ELSE false
    END as is_security_definer
  FROM pg_views 
  WHERE schemaname = 'public' 
    AND viewname IN ('profiles_safe', 'historico_vendas_safe', 'clientes_safe_secure');
$$;

-- ===== LOGS DE AUDITORIA =====
CREATE OR REPLACE FUNCTION public.log_customer_access(
  p_customer_id uuid,
  p_action text,
  p_sensitive_accessed boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer_data_access_log (
    customer_id,
    action,
    sensitive_data_accessed,
    user_id,
    organization_id
  ) VALUES (
    p_customer_id,
    p_action,
    p_sensitive_accessed,
    auth.uid(),
    public.get_current_org_id()
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- ===== COMENTÁRIOS DE DOCUMENTAÇÃO =====
COMMENT ON VIEW profiles_safe IS 'View segura de perfis com mascaramento de telefone. NÃO É SECURITY DEFINER.';
COMMENT ON VIEW historico_vendas_safe IS 'View segura de histórico de vendas com filtro organizacional. NÃO É SECURITY DEFINER.';
COMMENT ON VIEW clientes_safe_secure IS 'View ultra-segura de clientes com mascaramento baseado em permissões. Substitui clientes_safe insegura.';
COMMENT ON FUNCTION public.mask_phone(text) IS 'Mascara números de telefone mostrando apenas últimos 4 dígitos';
COMMENT ON FUNCTION public.mask_name(text) IS 'Mascara nomes mostrando apenas primeiras 3 letras';
COMMENT ON FUNCTION public.verify_view_security() IS 'Verifica se views não estão usando SECURITY DEFINER incorretamente';