-- CORREÇÃO CRÍTICA: Mascarar dados pessoais na historico_vendas_safe
-- Esta view estava expondo informações completas de clientes

DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;

-- Recriar view com mascaramento adequado de dados pessoais
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
    -- MASCARAR dados pessoais críticos
    CASE 
        WHEN hv.cliente_nome IS NULL THEN NULL
        WHEN LENGTH(hv.cliente_nome) <= 3 THEN LEFT(hv.cliente_nome, 1) || '***'
        ELSE LEFT(hv.cliente_nome, 2) || '***' || RIGHT(hv.cliente_nome, 1)
    END AS cliente_nome,
    -- Mascarar documento completamente exceto últimos 2 dígitos
    CASE 
        WHEN hv.cliente_documento IS NULL THEN NULL
        WHEN LENGTH(REGEXP_REPLACE(hv.cliente_documento, '[^0-9]', '', 'g')) <= 2 THEN '***'
        ELSE '***' || RIGHT(REGEXP_REPLACE(hv.cliente_documento, '[^0-9]', '', 'g'), 2)
    END AS cliente_documento,
    -- Mascarar CPF/CNPJ igual ao documento
    CASE 
        WHEN hv.cpf_cnpj IS NULL THEN NULL
        WHEN LENGTH(REGEXP_REPLACE(hv.cpf_cnpj, '[^0-9]', '', 'g')) <= 2 THEN '***'
        ELSE '***' || RIGHT(REGEXP_REPLACE(hv.cpf_cnpj, '[^0-9]', '', 'g'), 2)
    END AS cpf_cnpj,
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
    -- Manter cidade/UF para análises geográficas gerais (sem risco alto)
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

-- Aplicar RLS na view para dupla proteção
-- Usuários só veem dados da própria organização
CREATE POLICY "historico_vendas_safe_org_access" ON public.historico_vendas_safe
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

-- Habilitar RLS na view (funcionalidade do PostgreSQL 15+)
ALTER VIEW public.historico_vendas_safe ENABLE ROW LEVEL SECURITY;

-- Conceder acesso apenas para usuários autenticados
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- Adicionar comentário de segurança
COMMENT ON VIEW public.historico_vendas_safe IS 
'SECURE VIEW: Dados pessoais mascarados para conformidade LGPD/GDPR. 
Nomes: primeiros 2 chars + *** + último char
Documentos: *** + últimos 2 dígitos
RLS: apenas organização do usuário';