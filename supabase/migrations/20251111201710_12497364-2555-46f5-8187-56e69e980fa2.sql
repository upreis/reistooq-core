-- ============================================================================
-- MIGRATION: Limpeza de Schema - Remover Colunas Inexistentes e Duplicadas
-- ============================================================================
-- Objetivo: Remover 16 colunas da tabela devolucoes_avancadas identificadas como:
--           - Colunas que nunca terão dados da API ML (6 colunas)
--           - Colunas duplicadas/confusas (10 colunas)
-- Data: 2025-11-11
-- Referência: docs/ANALISE_COLUNAS_DEVOLUCOES.md
-- ============================================================================

-- ============================================================================
-- PARTE 1: Remover colunas que NUNCA terão dados da API ML (6 colunas)
-- ============================================================================

-- 1. score_qualidade - Não existe na API ML
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS score_qualidade;

-- 2. nivel_prioridade - Não existe na API ML
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS nivel_prioridade;

-- 3. impacto_reputacao - Não existe na API ML
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS impacto_reputacao;

-- 4. satisfacao_comprador - Não existe na API ML
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS satisfacao_comprador;

-- 5. warehouse_review - Não existe na API ML
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS warehouse_review;

-- 6. seller_review - Não existe na API ML
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS seller_review;

-- ============================================================================
-- PARTE 2: Remover colunas DUPLICADAS/CONFUSAS (10 colunas)
-- ============================================================================

-- 7. status_envio_devolucao - Duplicata de status_rastreamento
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS status_envio_devolucao;

-- 8. subtipo_claim - Não existe na API (confunde com subtype em dados_claim)
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS subtipo_claim;

-- 9. shipment_type - Duplicata de tipo_envio_devolucao
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS shipment_type;

-- 10. endereco_destino_devolucao - Duplicata de endereco_destino JSONB
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS endereco_destino_devolucao;

-- 11. timeline_rastreamento - Duplicata de tracking_events JSONB
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS timeline_rastreamento;

-- 12. destino_devolucao - Duplicata de endereco_destino
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS destino_devolucao;

-- 13. reembolso_quando - Duplicata de dados em dados_refund_info
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS reembolso_quando;

-- 14. status_dinheiro - Duplicata de dados em dados_financial_info
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS status_dinheiro;

-- 15. resultado_mediacao - Dados já em dados_claim.resolution
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS resultado_mediacao;

-- 16. proxima_acao_requerida - Duplicata de dados_available_actions
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS proxima_acao_requerida;

-- ============================================================================
-- RESUMO DA MIGRATION
-- ============================================================================
-- Total de colunas removidas: 16
-- - Colunas inexistentes na API ML: 6
-- - Colunas duplicadas/confusas: 10
-- 
-- Impacto:
-- - Schema mais limpo e organizado
-- - Menos confusão para desenvolvedores
-- - Melhor alinhamento com API do Mercado Livre
-- - Redução de espaço em disco
-- 
-- IMPORTANTE: 
-- Os dados relevantes continuam disponíveis nos campos JSONB apropriados
-- (dados_claim, dados_tracking_info, dados_financial_info, dados_refund_info, 
--  dados_available_actions, endereco_destino)
-- ============================================================================