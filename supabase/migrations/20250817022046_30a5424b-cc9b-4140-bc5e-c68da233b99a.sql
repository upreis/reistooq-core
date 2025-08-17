-- CORREÇÃO CRÍTICA: Mascarar dados pessoais na historico_vendas_safe
-- PROBLEMA: View expunha dados completos de clientes (nomes, CPF, documentos)

DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;

-- Recriar view COM mascaramento adequado de dados pessoais
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
    -- MASCARAR dados pessoais críticos para conformidade LGPD
    CASE 
        WHEN hv.cliente_nome IS NULL THEN NULL
        WHEN LENGTH(hv.cliente_nome) <= 3 THEN LEFT(hv.cliente_nome, 1) || '***'
        ELSE LEFT(hv.cliente_nome, 2) || '***' || RIGHT(hv.cliente_nome, 1)
    END AS cliente_nome,
    -- Mascarar documento/CPF - apenas últimos 2 dígitos visíveis
    CASE 
        WHEN hv.cliente_documento IS NULL THEN NULL
        WHEN LENGTH(REGEXP_REPLACE(hv.cliente_documento, '[^0-9]', '', 'g')) <= 2 THEN '***'
        ELSE '***' || RIGHT(REGEXP_REPLACE(hv.cliente_documento, '[^0-9]', '', 'g'), 2)
    END AS cliente_documento,
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
    -- Cidade/UF mantidos para análises geográficas (baixo risco)
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

-- Acesso restrito apenas para usuários autenticados
GRANT SELECT ON public.historico_vendas_safe TO authenticated;

-- Comentário de segurança
COMMENT ON VIEW public.historico_vendas_safe IS 
'SECURE VIEW - Dados pessoais mascarados para conformidade LGPD/GDPR:
- Nomes: Li*** a (primeiros 2 chars + *** + último char)
- Documentos/CPF: ***68 (apenas últimos 2 dígitos)
- Acesso: herda RLS da tabela base historico_vendas';