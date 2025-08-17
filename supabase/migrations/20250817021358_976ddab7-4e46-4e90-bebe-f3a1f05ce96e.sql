-- Fix Security Definer View - Move filtering to RLS and recreate views without SECURITY DEFINER functions

-- Drop existing safe views
DROP VIEW IF EXISTS public.profiles_safe CASCADE;
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;

-- Create profiles_safe view WITHOUT any SECURITY DEFINER function dependencies
CREATE VIEW public.profiles_safe AS
SELECT 
    p.id,
    p.nome_completo,
    p.nome_exibicao,
    -- Direct phone masking without using mask_phone function
    CASE 
        WHEN p.telefone IS NULL THEN NULL 
        ELSE '****' || RIGHT(p.telefone, 4) 
    END AS telefone,
    p.cargo,
    p.departamento,
    p.organizacao_id,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.onboarding_banner_dismissed,
    p.configuracoes_notificacao
FROM public.profiles p;

-- Create historico_vendas_safe view WITHOUT organization function dependency
-- Use direct join without get_current_org_id() function
CREATE VIEW public.historico_vendas_safe AS
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
JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id;

-- Grant SELECT permissions
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- Enable RLS on the views themselves
ALTER VIEW public.profiles_safe SET (security_barrier = true);
ALTER VIEW public.historico_vendas_safe SET (security_barrier = true);

-- Create RLS policies directly on the views (PostgreSQL 15+ feature)
-- For profiles_safe: filter by user's own organization
CREATE POLICY "profiles_safe_own_org" ON public.profiles_safe
FOR SELECT TO authenticated
USING (
    organizacao_id = (
        SELECT organizacao_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- For historico_vendas_safe: filter by user's organization through integration_accounts
CREATE POLICY "historico_vendas_safe_own_org" ON public.historico_vendas_safe
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.integration_accounts ia2
        JOIN public.profiles p ON p.organizacao_id = ia2.organization_id
        WHERE ia2.id = (
            SELECT integration_account_id 
            FROM public.historico_vendas hv2 
            WHERE hv2.id = historico_vendas_safe.id
        )
        AND p.id = auth.uid()
    )
);

-- Enable RLS on both views
ALTER VIEW public.profiles_safe ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.historico_vendas_safe ENABLE ROW LEVEL SECURITY;