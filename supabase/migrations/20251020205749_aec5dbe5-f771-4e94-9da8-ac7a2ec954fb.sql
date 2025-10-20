-- Adicionar colunas faltantes à tabela pedidos_cancelados_ml
-- Total: 94 colunas (excluindo comprador_telefone, comprador_email, cpf_cnpj)

-- BUYER DATA (sem telefone, email, cpf_cnpj)
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS comprador_endereco TEXT,
ADD COLUMN IF NOT EXISTS comprador_cidade TEXT,
ADD COLUMN IF NOT EXISTS comprador_estado TEXT,
ADD COLUMN IF NOT EXISTS comprador_cep TEXT,
ADD COLUMN IF NOT EXISTS comprador_pais TEXT,
ADD COLUMN IF NOT EXISTS comprador_reputacao JSONB DEFAULT '{}'::jsonb;

-- FINANCIAL DATA
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS custo_frete_devolucao NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_original_produto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_reembolsado_produto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS taxa_ml_reembolsada NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_logistico_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS impacto_financeiro_vendedor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentual_reembolsado NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_parcela NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS parcelas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS tipo_pagamento TEXT,
ADD COLUMN IF NOT EXISTS moeda_reembolso TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS data_processamento_reembolso TIMESTAMPTZ;

-- INTERNAL TAGS & METADATA
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS internal_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tem_financeiro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tem_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tem_sla BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nota_fiscal_autorizada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags_automaticas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS confiabilidade_dados TEXT DEFAULT 'high',
ADD COLUMN IF NOT EXISTS versao_api_utilizada TEXT,
ADD COLUMN IF NOT EXISTS fonte_dados_primaria TEXT,
ADD COLUMN IF NOT EXISTS hash_verificacao TEXT,
ADD COLUMN IF NOT EXISTS dados_incompletos BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS campos_faltantes JSONB DEFAULT '[]'::jsonb;

-- PRODUCT DATA
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS produto_warranty TEXT,
ADD COLUMN IF NOT EXISTS produto_categoria TEXT,
ADD COLUMN IF NOT EXISTS produto_thumbnail TEXT,
ADD COLUMN IF NOT EXISTS produto_troca_id TEXT,
ADD COLUMN IF NOT EXISTS status_produto_novo TEXT;

-- ANALYSIS & QUALITY
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS qualidade_comunicacao TEXT,
ADD COLUMN IF NOT EXISTS eficiencia_resolucao TEXT,
ADD COLUMN IF NOT EXISTS score_qualidade INTEGER,
ADD COLUMN IF NOT EXISTS score_satisfacao_final NUMERIC,
ADD COLUMN IF NOT EXISTS satisfacao_comprador TEXT,
ADD COLUMN IF NOT EXISTS impacto_reputacao TEXT DEFAULT 'low',
ADD COLUMN IF NOT EXISTS nivel_prioridade TEXT DEFAULT 'medium';

-- REASONS (API ML)
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS reason_id TEXT,
ADD COLUMN IF NOT EXISTS reason_category TEXT,
ADD COLUMN IF NOT EXISTS reason_name TEXT,
ADD COLUMN IF NOT EXISTS reason_detail TEXT,
ADD COLUMN IF NOT EXISTS reason_type TEXT,
ADD COLUMN IF NOT EXISTS reason_priority TEXT,
ADD COLUMN IF NOT EXISTS reason_expected_resolutions TEXT[],
ADD COLUMN IF NOT EXISTS reason_flow TEXT,
ADD COLUMN IF NOT EXISTS reason_rules_engine TEXT[],
ADD COLUMN IF NOT EXISTS motivo_categoria TEXT,
ADD COLUMN IF NOT EXISTS subcategoria_problema TEXT,
ADD COLUMN IF NOT EXISTS categoria_problema TEXT;

-- TEMPORAL & MILESTONES
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS data_criacao_claim TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_inicio_return TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_fechamento_claim TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_estimada_troca TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_limite_troca TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_vencimento_acao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_primeira_acao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marcos_temporais JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS timeline_consolidado JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS timeline_events JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS historico_status JSONB DEFAULT '[]'::jsonb;

-- COMPLEXITY & MEDIATION
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS nivel_complexidade TEXT,
ADD COLUMN IF NOT EXISTS resultado_mediacao TEXT,
ADD COLUMN IF NOT EXISTS mediador_ml TEXT,
ADD COLUMN IF NOT EXISTS em_mediacao BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_inicio_mediacao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS detalhes_mediacao JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS escalado_para_ml BOOLEAN DEFAULT false;

-- SLA & TIME METRICS
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS tempo_primeira_resposta_vendedor INTEGER,
ADD COLUMN IF NOT EXISTS tempo_resposta_comprador INTEGER,
ADD COLUMN IF NOT EXISTS tempo_analise_ml INTEGER,
ADD COLUMN IF NOT EXISTS tempo_resposta_medio INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dias_ate_resolucao INTEGER,
ADD COLUMN IF NOT EXISTS dias_restantes_acao INTEGER,
ADD COLUMN IF NOT EXISTS tempo_total_resolucao INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tempo_transito_dias INTEGER,
ADD COLUMN IF NOT EXISTS prazo_revisao_dias INTEGER,
ADD COLUMN IF NOT EXISTS sla_cumprido BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tempo_limite_acao TIMESTAMPTZ;

-- FEEDBACKS & MESSAGES
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS feedback_comprador TEXT,
ADD COLUMN IF NOT EXISTS feedback_vendedor TEXT,
ADD COLUMN IF NOT EXISTS feedback_comprador_final TEXT,
ADD COLUMN IF NOT EXISTS rating_comprador INTEGER,
ADD COLUMN IF NOT EXISTS rating_vendedor INTEGER,
ADD COLUMN IF NOT EXISTS timeline_mensagens JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ultima_mensagem_data TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ultima_mensagem_remetente TEXT,
ADD COLUMN IF NOT EXISTS mensagens_nao_lidas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS numero_interacoes INTEGER DEFAULT 0;

-- ATTACHMENTS & EVIDENCE
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS anexos_comprador JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS anexos_vendedor JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS anexos_ml JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS anexos_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_evidencias INTEGER DEFAULT 0;

-- SHIPPING & TRACKING
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS shipment_id_devolucao BIGINT,
ADD COLUMN IF NOT EXISTS transportadora_devolucao TEXT,
ADD COLUMN IF NOT EXISTS codigo_rastreamento_devolucao TEXT,
ADD COLUMN IF NOT EXISTS status_rastreamento_devolucao TEXT,
ADD COLUMN IF NOT EXISTS url_rastreamento TEXT,
ADD COLUMN IF NOT EXISTS localizacao_atual TEXT,
ADD COLUMN IF NOT EXISTS data_ultima_movimentacao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS previsao_entrega_vendedor TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tracking_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tracking_events JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS historico_localizacoes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS carrier_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS shipment_costs JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS shipment_delays JSONB DEFAULT '[]'::jsonb;

-- ADDRESS & DESTINATION
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS endereco_destino JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS endereco_destino_devolucao TEXT,
ADD COLUMN IF NOT EXISTS destino_devolucao TEXT;

-- COSTS & COMPENSATION
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS custo_envio_devolucao NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_compensacao NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS descricao_custos JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS valor_diferenca_troca NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS responsavel_custo TEXT,
ADD COLUMN IF NOT EXISTS moeda_custo TEXT DEFAULT 'BRL';

-- ACTIONS & REQUIREMENTS
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS acao_seller_necessaria BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS necessita_acao_manual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS proxima_acao_requerida TEXT,
ADD COLUMN IF NOT EXISTS usuario_ultima_acao TEXT;

-- REVIEW DATA
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS review_id TEXT,
ADD COLUMN IF NOT EXISTS review_status TEXT,
ADD COLUMN IF NOT EXISTS review_result TEXT,
ADD COLUMN IF NOT EXISTS data_inicio_review TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS observacoes_review TEXT,
ADD COLUMN IF NOT EXISTS revisor_responsavel TEXT,
ADD COLUMN IF NOT EXISTS acoes_necessarias_review JSONB DEFAULT '[]'::jsonb;

-- EXCHANGE DATA
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS eh_troca BOOLEAN DEFAULT false;

-- PROBLEMS & ISSUES
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS problemas_encontrados JSONB DEFAULT '[]'::jsonb;

-- REPUTATION
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS seller_reputation JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS buyer_reputation JSONB DEFAULT '{}'::jsonb;

-- ADDITIONAL METADATA
ALTER TABLE pedidos_cancelados_ml
ADD COLUMN IF NOT EXISTS claim_fulfilled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS return_intermediate_check JSONB,
ADD COLUMN IF NOT EXISTS resultado_final TEXT,
ADD COLUMN IF NOT EXISTS metodo_resolucao TEXT,
ADD COLUMN IF NOT EXISTS taxa_satisfacao NUMERIC;

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_ml_reason_category ON pedidos_cancelados_ml(reason_category);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_ml_nivel_prioridade ON pedidos_cancelados_ml(nivel_prioridade);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_ml_sla_cumprido ON pedidos_cancelados_ml(sla_cumprido);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_ml_tem_financeiro ON pedidos_cancelados_ml(tem_financeiro);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_ml_data_criacao_claim ON pedidos_cancelados_ml(data_criacao_claim);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_ml_eficiencia_resolucao ON pedidos_cancelados_ml(eficiencia_resolucao);