-- 🔧 CORREÇÃO FINAL: Eliminar todos os SECURITY DEFINER restantes

-- Verificar e corrigir qualquer view ou função ainda com SECURITY DEFINER
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Procurar todas as views com SECURITY DEFINER no schema public
    FOR r IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', r.schemaname, r.viewname);
        RAISE NOTICE 'Dropped view %.%', r.schemaname, r.viewname;
    END LOOP;
END $$;

-- Recriar TODAS as views necessárias SEM SECURITY DEFINER

-- 1. profiles_safe - SEM security definer
CREATE OR REPLACE VIEW profiles_safe AS
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

-- 2. historico_vendas_safe - SEM security definer
CREATE OR REPLACE VIEW historico_vendas_safe AS
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

-- 3. clientes_safe - SEM security definer
CREATE OR REPLACE VIEW clientes_safe AS
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

-- Verificação final
SELECT 
  'Views with SECURITY DEFINER found: ' || COUNT(*) as status
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%SECURITY DEFINER%';