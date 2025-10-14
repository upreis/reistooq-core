-- ============================================
-- CRIAR TABELA: pedidos_cancelados_ml
-- Tabela completa com FASE 1 + FASE 2
-- ============================================

CREATE TABLE IF NOT EXISTS public.pedidos_cancelados_ml (
  -- Chaves Primárias e Controle
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  claim_id TEXT,
  integration_account_id UUID REFERENCES public.integration_accounts(id) ON DELETE CASCADE,
  
  -- Dados Básicos do Pedido
  status TEXT,
  date_created TIMESTAMP WITH TIME ZONE,
  date_closed TIMESTAMP WITH TIME ZONE,
  total_amount NUMERIC,
  
  -- Dados do Produto
  item_id TEXT,
  item_title TEXT,
  quantity INTEGER,
  sku TEXT,
  
  -- Dados do Comprador (Básicos)
  buyer_id TEXT,
  buyer_nickname TEXT,
  
  -- 🟡 FASE 2: Dados Adicionais do Comprador
  comprador_cpf_cnpj TEXT,
  comprador_nome_completo TEXT,
  comprador_nickname TEXT,
  
  -- 🟡 FASE 2: Dados de Pagamento
  metodo_pagamento TEXT,
  tipo_pagamento TEXT,
  numero_parcelas INTEGER,
  valor_parcela NUMERIC,
  transaction_id TEXT,
  
  -- 🟡 FASE 2: Dados Financeiros Adicionais
  percentual_reembolsado INTEGER,
  
  -- 🟡 FASE 2: Tags
  tags_pedido TEXT[],
  
  -- Status e Classificação
  status_devolucao TEXT,
  status_dinheiro TEXT,
  categoria_problema TEXT,
  subcategoria_problema TEXT,
  motivo_categoria TEXT,
  
  -- Devolução e Troca
  eh_troca BOOLEAN DEFAULT FALSE,
  produto_troca_id TEXT,
  produto_troca_titulo TEXT,
  
  -- Datas Importantes
  data_estimada_troca TIMESTAMP WITH TIME ZONE,
  data_limite_troca TIMESTAMP WITH TIME ZONE,
  data_vencimento_acao TIMESTAMP WITH TIME ZONE,
  dias_restantes_acao INTEGER,
  
  -- Rastreamento
  shipment_id TEXT,
  codigo_rastreamento TEXT,
  transportadora TEXT,
  status_rastreamento TEXT,
  localizacao_atual TEXT,
  status_transporte_atual TEXT,
  data_ultima_movimentacao TIMESTAMP WITH TIME ZONE,
  tempo_transito_dias INTEGER,
  
  -- Dados Estruturados (JSONB)
  tracking_history JSONB DEFAULT '[]',
  tracking_events JSONB DEFAULT '[]',
  historico_localizacoes JSONB DEFAULT '[]',
  carrier_info JSONB DEFAULT '{}',
  shipment_delays JSONB DEFAULT '[]',
  shipment_costs JSONB DEFAULT '{}',
  
  -- Financeiro
  custo_envio_devolucao NUMERIC,
  valor_compensacao NUMERIC,
  responsavel_custo TEXT,
  
  -- Mensagens e Anexos
  mensagens_nao_lidas INTEGER DEFAULT 0,
  ultima_mensagem_data TIMESTAMP WITH TIME ZONE,
  timeline_mensagens JSONB DEFAULT '[]',
  anexos_count INTEGER DEFAULT 0,
  anexos_comprador JSONB DEFAULT '[]',
  anexos_vendedor JSONB DEFAULT '[]',
  anexos_ml JSONB DEFAULT '[]',
  
  -- Mediação e Ações
  em_mediacao BOOLEAN DEFAULT FALSE,
  escalado_para_ml BOOLEAN DEFAULT FALSE,
  acao_seller_necessaria BOOLEAN DEFAULT FALSE,
  nivel_prioridade TEXT DEFAULT 'medium',
  
  -- Tipo e Subtipo
  tipo_claim TEXT,
  subtipo_claim TEXT,
  
  -- Controle de Qualidade
  dados_completos BOOLEAN DEFAULT FALSE,
  marketplace_origem TEXT DEFAULT 'ML_BRASIL',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(order_id, integration_account_id)
);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_order_id ON pedidos_cancelados_ml(order_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_integration_account ON pedidos_cancelados_ml(integration_account_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_status ON pedidos_cancelados_ml(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_date_created ON pedidos_cancelados_ml(date_created);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_claim_id ON pedidos_cancelados_ml(claim_id);

-- 🟡 FASE 2: Índices Adicionais
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_cpf_cnpj ON pedidos_cancelados_ml(comprador_cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_metodo_pagamento ON pedidos_cancelados_ml(metodo_pagamento);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_tags ON pedidos_cancelados_ml USING GIN(tags_pedido);

-- RLS Policies
ALTER TABLE public.pedidos_cancelados_ml ENABLE ROW LEVEL SECURITY;

-- Policy: Users podem ver pedidos cancelados da sua organização
CREATE POLICY "pedidos_cancelados_select_org" 
ON public.pedidos_cancelados_ml 
FOR SELECT 
USING (
  integration_account_id IN (
    SELECT id FROM public.integration_accounts 
    WHERE organization_id = public.get_current_org_id()
  )
);

-- Policy: Edge functions podem inserir/atualizar
CREATE POLICY "pedidos_cancelados_insert_org" 
ON public.pedidos_cancelados_ml 
FOR INSERT 
WITH CHECK (
  integration_account_id IN (
    SELECT id FROM public.integration_accounts 
    WHERE organization_id = public.get_current_org_id()
  )
);

CREATE POLICY "pedidos_cancelados_update_org" 
ON public.pedidos_cancelados_ml 
FOR UPDATE 
USING (
  integration_account_id IN (
    SELECT id FROM public.integration_accounts 
    WHERE organization_id = public.get_current_org_id()
  )
);

-- Comentários de Documentação
COMMENT ON TABLE public.pedidos_cancelados_ml IS 'Pedidos cancelados/devolvidos do Mercado Livre com dados enriquecidos das APIs de Claims, Returns, Orders e Shipments';

-- FASE 2: Comentários dos novos campos
COMMENT ON COLUMN pedidos_cancelados_ml.comprador_cpf_cnpj IS 'CPF/CNPJ do comprador para identificação e análise de fraude';
COMMENT ON COLUMN pedidos_cancelados_ml.comprador_nome_completo IS 'Nome completo do comprador (first_name + last_name)';
COMMENT ON COLUMN pedidos_cancelados_ml.metodo_pagamento IS 'Método de pagamento utilizado (visa, mastercard, pix, etc)';
COMMENT ON COLUMN pedidos_cancelados_ml.tipo_pagamento IS 'Tipo de pagamento (credit_card, debit_card, etc)';
COMMENT ON COLUMN pedidos_cancelados_ml.numero_parcelas IS 'Número de parcelas do pagamento';
COMMENT ON COLUMN pedidos_cancelados_ml.valor_parcela IS 'Valor de cada parcela';
COMMENT ON COLUMN pedidos_cancelados_ml.transaction_id IS 'ID da transação para rastreamento financeiro';
COMMENT ON COLUMN pedidos_cancelados_ml.percentual_reembolsado IS 'Percentual do valor reembolsado (0-100)';
COMMENT ON COLUMN pedidos_cancelados_ml.tags_pedido IS 'Tags do pedido para filtros avançados (ex: order_has_discount, paid, delivered)';