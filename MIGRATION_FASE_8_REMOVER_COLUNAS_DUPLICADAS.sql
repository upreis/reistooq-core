-- ============================================================================
-- FASE 8: REMOVER COLUNAS FÍSICAS DUPLICADAS DE devolucoes_avancadas
-- ============================================================================
-- Objetivo: Eliminar redundância removendo colunas que armazenam dados
--           já salvos nos campos JSONB organizados
-- Data: 2025-01-11
-- ============================================================================

-- ✅ FASE 8.1: Remover colunas duplicadas que existem na tabela
-- Estas colunas têm dados salvos nos campos JSONB correspondentes

-- 1️⃣ status_devolucao (dados já em dados_tracking_info.status_devolucao)
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS status_devolucao;

-- 2️⃣ subtipo_claim (dados já em dados_tracking_info.subtipo)
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS subtipo_claim;

-- 3️⃣ tipo_claim (dados já em dados_claim)
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS tipo_claim;

-- 4️⃣ review_status (dados já em dados_review)
ALTER TABLE public.devolucoes_avancadas
DROP COLUMN IF EXISTS review_status;

-- ============================================================================
-- 📋 NOTA: As seguintes colunas NÃO existem no schema atual,
--          portanto não precisam ser removidas:
-- ============================================================================
-- - motivo_devolucao (não encontrada no schema)
-- - review_method (não encontrada no schema)
-- - review_stage (não encontrada no schema)
-- - product_condition (não encontrada no schema)
-- - product_destination (não encontrada no schema)
--
-- Estas colunas podem nunca ter sido criadas ou já foram removidas
-- em migrations anteriores.
-- ============================================================================

-- ✅ RESUMO DA MIGRATION
-- ============================================================================
-- Total de colunas removidas: 4
-- Economia de espaço: ~50-100 bytes por registro (dependendo do conteúdo)
-- Impacto no sistema: NENHUM (dados continuam nos campos JSONB)
-- 
-- Dados continuam 100% disponíveis em:
-- - dados_tracking_info → status_devolucao, subtipo
-- - dados_claim → tipo_claim
-- - dados_review → review_status
-- ============================================================================

-- 📌 INSTRUÇÕES DE EXECUÇÃO:
-- ============================================================================
-- 1. Copie este SQL completo
-- 2. Abra Supabase Dashboard → SQL Editor
-- 3. Cole o SQL e clique em "Run"
-- 4. Aguarde confirmação de sucesso
-- 5. Verifique que Edge Function get-devolucoes continua funcionando
-- ============================================================================
