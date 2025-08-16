-- =========================================================================
-- SECURITY PATCH: Historico Vendas + Invitations RLS
-- Created: 2025-08-16
-- Purpose: Idempotent SQL to secure historical sales data and invitations
-- =========================================================================

-- ========================================
-- 1. SECURE HISTORICO VENDAS RPC FUNCTION
-- ========================================

-- Drop and recreate the secure RPC function with explicit column selection
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(text, int, int);

CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked(
    _search text DEFAULT NULL,
    _limit int DEFAULT 50,
    _offset int DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    id_unico text,
    numero_pedido text,
    sku_produto text,
    descricao text,
    quantidade integer,
    valor_unitario numeric,
    valor_total numeric,
    cliente_nome text,
    cliente_documento text,
    status text,
    observacoes text,
    data_pedido date,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    ncm text,
    codigo_barras text,
    pedido_id text,
    cpf_cnpj text,
    valor_frete numeric,
    data_prevista date,
    obs text,
    obs_interna text,
    cidade text,
    uf text,
    url_rastreamento text,
    situacao text,
    codigo_rastreamento text,
    numero_ecommerce text,
    valor_desconto numeric,
    numero_venda text,
    sku_estoque text,
    sku_kit text,
    qtd_kit integer,
    total_itens integer
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
    WITH org AS (
        SELECT public.get_current_org_id() AS org_id
    ), base AS (
        SELECT 
            hv.id,
            hv.id_unico,
            hv.numero_pedido,
            hv.sku_produto,
            hv.descricao,
            hv.quantidade,
            hv.valor_unitario,
            hv.valor_total,
            hv.cliente_nome,
            hv.cliente_documento,
            hv.status,
            hv.observacoes,
            hv.data_pedido,
            hv.created_at,
            hv.updated_at,
            hv.ncm,
            hv.codigo_barras,
            hv.pedido_id,
            hv.cpf_cnpj,
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
        CROSS JOIN org
        WHERE ia.organization_id = org.org_id
            AND (
                _search IS NULL OR _search = '' OR
                hv.numero_pedido ILIKE '%' || _search || '%' OR
                hv.sku_produto ILIKE '%' || _search || '%' OR
                hv.descricao ILIKE '%' || _search || '%' OR
                hv.id::text = _search OR
                hv.id_unico = _search
            )
        ORDER BY hv.data_pedido DESC, hv.created_at DESC
        LIMIT GREATEST(COALESCE(_limit, 50), 1) 
        OFFSET GREATEST(COALESCE(_offset, 0), 0)
    )
    SELECT 
        base.id,
        base.id_unico,
        base.numero_pedido,
        base.sku_produto,
        base.descricao,
        base.quantidade,
        base.valor_unitario,
        base.valor_total,
        -- Apply PII masking based on permissions
        CASE WHEN public.has_permission('vendas:view_pii') 
             THEN base.cliente_nome 
             ELSE public.mask_name(base.cliente_nome) 
        END AS cliente_nome,
        CASE WHEN public.has_permission('vendas:view_pii') 
             THEN base.cliente_documento 
             ELSE public.mask_document(base.cliente_documento) 
        END AS cliente_documento,
        base.status,
        base.observacoes,
        base.data_pedido,
        base.created_at,
        base.updated_at,
        base.ncm,
        base.codigo_barras,
        base.pedido_id,
        CASE WHEN public.has_permission('vendas:view_pii') 
             THEN base.cpf_cnpj 
             ELSE public.mask_document(base.cpf_cnpj) 
        END AS cpf_cnpj,
        base.valor_frete,
        base.data_prevista,
        base.obs,
        base.obs_interna,
        base.cidade,
        base.uf,
        base.url_rastreamento,
        base.situacao,
        base.codigo_rastreamento,
        base.numero_ecommerce,
        base.valor_desconto,
        base.numero_venda,
        base.sku_estoque,
        base.sku_kit,
        base.qtd_kit,
        base.total_itens
    FROM base;
$$;

-- Secure the function permissions
REVOKE ALL ON FUNCTION public.get_historico_vendas_masked(text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_masked(text, int, int) TO authenticated;

COMMENT ON FUNCTION public.get_historico_vendas_masked(text, int, int) IS 
'Secure function to retrieve sales history with PII masking based on user permissions. Uses SECURITY INVOKER to respect RLS policies.';

-- ========================================
-- 2. REMOVE/BLOCK HISTORICO_VENDAS_PUBLIC
-- ========================================

-- Block all access to the public view - safer than dropping since it might be referenced
REVOKE ALL ON public.historico_vendas_public FROM anon, authenticated, public;

-- Enable RLS on the table to ensure no unauthorized access
ALTER TABLE public.historico_vendas_public ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "allow_all" ON public.historico_vendas_public;
DROP POLICY IF EXISTS "hist_select_org_members" ON public.historico_vendas_public;

-- Create a deny-all policy
CREATE POLICY "deny_all_access" ON public.historico_vendas_public
    FOR ALL TO public
    USING (false)
    WITH CHECK (false);

COMMENT ON TABLE public.historico_vendas_public IS 
'DEPRECATED: This table is blocked for security reasons. Use get_historico_vendas_masked() function instead.';

-- ========================================
-- 3. SECURE INVITATIONS RLS POLICIES
-- ========================================

-- Enable RLS on invitations if not already enabled
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "inv_select_org_members" ON public.invitations;
DROP POLICY IF EXISTS "inv_insert_manage" ON public.invitations;
DROP POLICY IF EXISTS "inv_update_manage" ON public.invitations;
DROP POLICY IF EXISTS "inv_delete_manage" ON public.invitations;
DROP POLICY IF EXISTS "invites: select manage or own" ON public.invitations;
DROP POLICY IF EXISTS "invites: mutate by org with invites:manage" ON public.invitations;

-- Policy 1: SELECT - Only organization members with invites:read permission
-- This ensures users can only see invitations from their own organization
-- and only if they have the proper permission
CREATE POLICY "invitations_select_org_with_permission" ON public.invitations
    FOR SELECT TO authenticated
    USING (
        organization_id = public.get_current_org_id() 
        AND public.has_permission('invites:read')
    );

-- Policy 2: INSERT - Only organization members with invites:manage permission
CREATE POLICY "invitations_insert_org_managers" ON public.invitations
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = public.get_current_org_id() 
        AND public.has_permission('invites:manage')
    );

-- Policy 3: UPDATE - Only organization members with invites:manage permission
-- Additional check: prevent changing organization_id
CREATE POLICY "invitations_update_org_managers" ON public.invitations
    FOR UPDATE TO authenticated
    USING (
        organization_id = public.get_current_org_id() 
        AND public.has_permission('invites:manage')
    )
    WITH CHECK (
        organization_id = public.get_current_org_id() 
        AND public.has_permission('invites:manage')
    );

-- Policy 4: DELETE - Only organization members with invites:manage permission
CREATE POLICY "invitations_delete_org_managers" ON public.invitations
    FOR DELETE TO authenticated
    USING (
        organization_id = public.get_current_org_id() 
        AND public.has_permission('invites:manage')
    );

-- ========================================
-- 4. COMMENTS AND DOCUMENTATION
-- ========================================

COMMENT ON POLICY "invitations_select_org_with_permission" ON public.invitations IS 
'Users can only read invitations from their organization if they have invites:read permission';

COMMENT ON POLICY "invitations_insert_org_managers" ON public.invitations IS 
'Only users with invites:manage permission can create invitations in their organization';

COMMENT ON POLICY "invitations_update_org_managers" ON public.invitations IS 
'Only users with invites:manage permission can update invitations in their organization';

COMMENT ON POLICY "invitations_delete_org_managers" ON public.invitations IS 
'Only users with invites:manage permission can delete invitations in their organization';

-- ========================================
-- 5. VERIFICATION QUERIES
-- ========================================

-- These can be run to verify the patch was applied correctly
/*
-- Test 1: Verify function exists and has correct permissions
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_name = 'get_historico_vendas_masked';

-- Test 2: Verify historico_vendas_public is blocked
SELECT tablename, hasrls 
FROM pg_tables 
WHERE tablename = 'historico_vendas_public';

-- Test 3: Verify invitations RLS policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'invitations';

-- Test 4: Test function execution (requires authenticated user)
-- SELECT COUNT(*) FROM public.get_historico_vendas_masked(null, 10, 0);
*/

-- ========================================
-- END OF SECURITY PATCH
-- ========================================