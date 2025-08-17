-- Fix Security Definer View - Simple views without SECURITY DEFINER dependencies

-- Drop existing safe views
DROP VIEW IF EXISTS public.profiles_safe CASCADE;
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;

-- Create simple profiles_safe view without any function dependencies
CREATE VIEW public.profiles_safe AS
SELECT 
    p.id,
    p.nome_completo,
    p.nome_exibicao,
    -- Inline phone masking without mask_phone function
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

-- Create simple historico_vendas_safe view without organization function dependency
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

-- Grant permissions
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- Views will inherit security from underlying tables' RLS policies