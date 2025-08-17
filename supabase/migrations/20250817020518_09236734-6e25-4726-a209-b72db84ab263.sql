-- Fix Security Definer View Issue
-- Replace views that use SECURITY DEFINER functions with proper RLS-enabled access

-- Drop existing safe views that use SECURITY DEFINER functions
DROP VIEW IF EXISTS public.profiles_safe CASCADE;
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;

-- Create secure profiles_safe view without SECURITY DEFINER dependency
-- This view will rely on RLS policies on the underlying profiles table
CREATE VIEW public.profiles_safe
WITH (security_barrier = true) AS
SELECT 
    id,
    nome_completo,
    nome_exibicao,
    mask_phone(telefone) AS telefone,
    cargo,
    departamento,
    organizacao_id,
    avatar_url,
    created_at,
    updated_at,
    onboarding_banner_dismissed,
    configuracoes_notificacao
FROM public.profiles
WHERE organizacao_id = (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
);

-- Enable RLS on profiles_safe view
ALTER VIEW public.profiles_safe SET (security_barrier = true);

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_safe TO authenticated;

-- Create secure historico_vendas_safe view without SECURITY DEFINER dependency
-- This view will use direct organization filtering
CREATE VIEW public.historico_vendas_safe
WITH (security_barrier = true) AS
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
JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
JOIN public.profiles p ON p.organizacao_id = ia.organization_id
WHERE p.id = auth.uid();

-- Enable security barrier on historico_vendas_safe view
ALTER VIEW public.historico_vendas_safe SET (security_barrier = true);

-- Grant access to authenticated users
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- Create RLS policies for the safe views if needed
-- These policies ensure users can only see data from their own organization

-- Policy for profiles_safe (inherits from profiles table RLS)
-- No additional RLS needed as the view already filters by user's organization

-- Policy for historico_vendas_safe (inherits from underlying table RLS)
-- No additional RLS needed as the view already filters by user's organization through joins

COMMENT ON VIEW public.profiles_safe IS 'Secure view of profiles with phone masking and organization filtering without SECURITY DEFINER';
COMMENT ON VIEW public.historico_vendas_safe IS 'Secure view of sales history filtered by user organization without SECURITY DEFINER';