-- Adicionar novos campos para timeline completo e endpoints corretos
-- Baseado na análise dos endpoints do Mercado Livre

-- FASE 1: Timeline e Eventos
ALTER TABLE public.devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS timeline_events JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS timeline_consolidado JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS data_criacao_claim TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data_inicio_return TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data_finalizacao_timeline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS eventos_sistema JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS marcos_temporais JSONB DEFAULT '{}';

-- FASE 2: Shipment History (endpoint correto /shipments/{id}/history)
ALTER TABLE public.devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS shipment_id TEXT,
ADD COLUMN IF NOT EXISTS tracking_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS shipment_costs JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS shipment_delays JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS carrier_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tracking_events JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS status_transporte_atual TEXT,
ADD COLUMN IF NOT EXISTS localizacao_atual TEXT,
ADD COLUMN IF NOT EXISTS data_ultima_movimentacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS previsao_entrega_vendedor TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS transportadora_devolucao TEXT,
ADD COLUMN IF NOT EXISTS codigo_rastreamento_devolucao TEXT,
ADD COLUMN IF NOT EXISTS historico_localizacoes JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tempo_transito_dias INTEGER;

-- FASE 3: Reviews (incluídos nos dados de return)
ALTER TABLE public.devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS review_id TEXT,
ADD COLUMN IF NOT EXISTS review_status TEXT,
ADD COLUMN IF NOT EXISTS review_result TEXT,
ADD COLUMN IF NOT EXISTS problemas_encontrados JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS acoes_necessarias_review JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS data_inicio_review TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS score_qualidade INTEGER,
ADD COLUMN IF NOT EXISTS necessita_acao_manual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS observacoes_review TEXT,
ADD COLUMN IF NOT EXISTS revisor_responsavel TEXT;

-- FASE 4: Análise Temporal
ALTER TABLE public.devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS tempo_primeira_resposta_vendedor INTEGER,
ADD COLUMN IF NOT EXISTS tempo_resposta_comprador INTEGER,
ADD COLUMN IF NOT EXISTS tempo_analise_ml INTEGER,
ADD COLUMN IF NOT EXISTS dias_ate_resolucao INTEGER,
ADD COLUMN IF NOT EXISTS eficiencia_resolucao TEXT,
ADD COLUMN IF NOT EXISTS sla_cumprido BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tempo_limite_acao TIMESTAMP WITH TIME ZONE;

-- FASE 5: Análise de Qualidade
ALTER TABLE public.devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS qualidade_comunicacao TEXT,
ADD COLUMN IF NOT EXISTS score_satisfacao_final NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS feedback_comprador_final TEXT,
ADD COLUMN IF NOT EXISTS feedback_vendedor TEXT,
ADD COLUMN IF NOT EXISTS nivel_complexidade TEXT,
ADD COLUMN IF NOT EXISTS categoria_problema TEXT,
ADD COLUMN IF NOT EXISTS subcategoria_problema TEXT;

-- FASE 6: Dados Financeiros Expandidos
ALTER TABLE public.devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS valor_reembolso_total NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_reembolso_produto NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_reembolso_frete NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS taxa_ml_reembolso NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS custo_logistico_total NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS impacto_financeiro_vendedor NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS moeda_reembolso TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS metodo_reembolso TEXT,
ADD COLUMN IF NOT EXISTS data_processamento_reembolso TIMESTAMP WITH TIME ZONE;

-- FASE 7: Metadados e Contexto
ALTER TABLE public.devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS origem_timeline TEXT,
ADD COLUMN IF NOT EXISTS versao_api_utilizada TEXT,
ADD COLUMN IF NOT EXISTS confiabilidade_dados TEXT,
ADD COLUMN IF NOT EXISTS dados_incompletos BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS campos_faltantes JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS hash_verificacao TEXT,
ADD COLUMN IF NOT EXISTS fonte_dados_primaria TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.devolucoes_avancadas.timeline_events IS 'Array cronológico de todos eventos da devolução';
COMMENT ON COLUMN public.devolucoes_avancadas.tracking_history IS 'Histórico completo de rastreamento via /shipments/{id}/history';
COMMENT ON COLUMN public.devolucoes_avancadas.shipment_costs IS 'Custos detalhados via /shipments/{id}/costs';
COMMENT ON COLUMN public.devolucoes_avancadas.carrier_info IS 'Informações da transportadora via /shipments/{id}/carrier';
COMMENT ON COLUMN public.devolucoes_avancadas.review_result IS 'Reviews incluídos nos dados de return (não endpoint separado)';
COMMENT ON COLUMN public.devolucoes_avancadas.origem_timeline IS 'automatico, manual ou hibrido';
COMMENT ON COLUMN public.devolucoes_avancadas.eficiencia_resolucao IS 'rapida, normal ou lenta';
COMMENT ON COLUMN public.devolucoes_avancadas.nivel_complexidade IS 'simples, medio ou complexo';