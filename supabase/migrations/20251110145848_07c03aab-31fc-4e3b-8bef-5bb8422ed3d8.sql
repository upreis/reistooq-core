-- FASE 1: Adicionar campos JSONB para persistência de dados enriquecidos da API ML
-- Referência: AUDITORIA_COLUNAS_VAZIAS.md e PLANO_IMPLEMENTACAO_PERSISTENCIA_DADOS.md

-- Adicionar 11 campos JSONB à tabela devolucoes_avancadas
ALTER TABLE public.devolucoes_avancadas
ADD COLUMN IF NOT EXISTS dados_review JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dados_comunicacao JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dados_deadlines JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dados_acoes_disponiveis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dados_custos_logistica JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dados_fulfillment JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dados_lead_time JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dados_available_actions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dados_shipping_costs JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dados_refund_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dados_product_condition JSONB DEFAULT '{}'::jsonb;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.devolucoes_avancadas.dados_review IS 'Informações de revisão: status_review, reviewer_id, review_date, review_notes, review_result';
COMMENT ON COLUMN public.devolucoes_avancadas.dados_comunicacao IS 'Informações de comunicação: total_messages, last_message_from, last_message_date, has_seller_response';
COMMENT ON COLUMN public.devolucoes_avancadas.dados_deadlines IS 'Prazos calculados: shipment_deadline, seller_receive_deadline, seller_review_deadline, meli_decision_deadline';
COMMENT ON COLUMN public.devolucoes_avancadas.dados_acoes_disponiveis IS 'Ações disponíveis para o seller: available_actions array';
COMMENT ON COLUMN public.devolucoes_avancadas.dados_custos_logistica IS 'Custos de logística: shipping_cost, return_cost, responsible_party';
COMMENT ON COLUMN public.devolucoes_avancadas.dados_fulfillment IS 'Informações de fulfillment: is_fulfillment, warehouse_id, warehouse_name';
COMMENT ON COLUMN public.devolucoes_avancadas.dados_lead_time IS 'Tempos de processamento e envio do lead time';
COMMENT ON COLUMN public.devolucoes_avancadas.dados_available_actions IS 'Ações disponíveis detalhadas da API';
COMMENT ON COLUMN public.devolucoes_avancadas.dados_shipping_costs IS 'Detalhes completos de custos de envio';
COMMENT ON COLUMN public.devolucoes_avancadas.dados_refund_info IS 'Informações de reembolso: amount, currency, status, method';
COMMENT ON COLUMN public.devolucoes_avancadas.dados_product_condition IS 'Condição do produto: condition, benefited_party, evaluation';

-- Criar índices GIN para melhor performance em queries JSONB
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_review ON public.devolucoes_avancadas USING GIN (dados_review);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_comunicacao ON public.devolucoes_avancadas USING GIN (dados_comunicacao);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_deadlines ON public.devolucoes_avancadas USING GIN (dados_deadlines);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_acoes ON public.devolucoes_avancadas USING GIN (dados_acoes_disponiveis);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_custos ON public.devolucoes_avancadas USING GIN (dados_custos_logistica);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_fulfillment ON public.devolucoes_avancadas USING GIN (dados_fulfillment);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_lead_time ON public.devolucoes_avancadas USING GIN (dados_lead_time);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_actions ON public.devolucoes_avancadas USING GIN (dados_available_actions);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_shipping ON public.devolucoes_avancadas USING GIN (dados_shipping_costs);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_refund ON public.devolucoes_avancadas USING GIN (dados_refund_info);
CREATE INDEX IF NOT EXISTS idx_devolucoes_dados_condition ON public.devolucoes_avancadas USING GIN (dados_product_condition);