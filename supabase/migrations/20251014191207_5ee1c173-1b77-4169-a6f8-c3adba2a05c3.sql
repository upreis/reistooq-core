-- FASE 2 E 3: ADICIONAR COLUNAS FALTANTES
-- Adicionando todas as colunas que estavam documentadas mas não existem no banco

-- === FASE 2: DADOS DO COMPRADOR E PAGAMENTO (10 COLUNAS) ===

-- Dados do Comprador (3 campos)
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS comprador_cpf TEXT;
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS comprador_nome_completo TEXT;
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS comprador_nickname TEXT;

-- Dados de Pagamento (5 campos) - metodo_pagamento já existe
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS tipo_pagamento TEXT;
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS parcelas INTEGER;
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Métricas Financeiras (2 campos)
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS percentual_reembolsado NUMERIC(5,2);
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS tags_pedido TEXT[];

-- === FASE 3: CAMPOS AVANÇADOS (15 COLUNAS) ===

-- 1. Custos Detalhados (5 campos)
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS custo_frete_devolucao NUMERIC(10,2);
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS custo_logistico_total NUMERIC(10,2);
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS valor_original_produto NUMERIC(10,2);
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS valor_reembolso_produto NUMERIC(10,2);
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS taxa_ml_reembolso NUMERIC(10,2);

-- 2. Internal Tags e Metadados (5 campos)
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS internal_tags TEXT[];
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS tem_financeiro BOOLEAN DEFAULT FALSE;
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS tem_review BOOLEAN DEFAULT FALSE;
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS tem_sla BOOLEAN DEFAULT FALSE;
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS nota_fiscal_autorizada BOOLEAN DEFAULT FALSE;

-- 3. Dados de Produto (3 campos) - produto_categoria, produto_warranty, produto_thumbnail já existem

-- 4. Análise e Qualidade (2 campos) - qualidade_comunicacao já existe
ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS eficiencia_resolucao TEXT;

-- === ÍNDICES PARA PERFORMANCE ===

-- Índices Fase 2
CREATE INDEX IF NOT EXISTS idx_devolucoes_comprador_cpf ON public.devolucoes_avancadas(comprador_cpf);
CREATE INDEX IF NOT EXISTS idx_devolucoes_comprador_nickname ON public.devolucoes_avancadas(comprador_nickname);
CREATE INDEX IF NOT EXISTS idx_devolucoes_tipo_pagamento ON public.devolucoes_avancadas(tipo_pagamento);
CREATE INDEX IF NOT EXISTS idx_devolucoes_tags_pedido ON public.devolucoes_avancadas USING GIN(tags_pedido);

-- Índices Fase 3
CREATE INDEX IF NOT EXISTS idx_devolucoes_internal_tags ON public.devolucoes_avancadas USING GIN(internal_tags);
CREATE INDEX IF NOT EXISTS idx_devolucoes_tem_financeiro ON public.devolucoes_avancadas(tem_financeiro);
CREATE INDEX IF NOT EXISTS idx_devolucoes_tem_review ON public.devolucoes_avancadas(tem_review);
CREATE INDEX IF NOT EXISTS idx_devolucoes_tem_sla ON public.devolucoes_avancadas(tem_sla);
CREATE INDEX IF NOT EXISTS idx_devolucoes_eficiencia ON public.devolucoes_avancadas(eficiencia_resolucao);

-- === COMENTÁRIOS ===
COMMENT ON COLUMN public.devolucoes_avancadas.comprador_cpf IS 'CPF/CNPJ do comprador';
COMMENT ON COLUMN public.devolucoes_avancadas.comprador_nome_completo IS 'Nome completo do comprador';
COMMENT ON COLUMN public.devolucoes_avancadas.comprador_nickname IS 'Nickname do comprador no ML';
COMMENT ON COLUMN public.devolucoes_avancadas.tipo_pagamento IS 'Tipo de pagamento utilizado';
COMMENT ON COLUMN public.devolucoes_avancadas.parcelas IS 'Número de parcelas do pagamento';
COMMENT ON COLUMN public.devolucoes_avancadas.transaction_id IS 'ID da transação de pagamento';
COMMENT ON COLUMN public.devolucoes_avancadas.percentual_reembolsado IS 'Percentual do valor reembolsado';
COMMENT ON COLUMN public.devolucoes_avancadas.tags_pedido IS 'Tags associadas ao pedido';
COMMENT ON COLUMN public.devolucoes_avancadas.custo_frete_devolucao IS 'Custo do frete de devolução';
COMMENT ON COLUMN public.devolucoes_avancadas.custo_logistico_total IS 'Custo logístico total';
COMMENT ON COLUMN public.devolucoes_avancadas.valor_original_produto IS 'Valor original do produto antes de descontos';
COMMENT ON COLUMN public.devolucoes_avancadas.valor_reembolso_produto IS 'Valor efetivamente reembolsado do produto';
COMMENT ON COLUMN public.devolucoes_avancadas.taxa_ml_reembolso IS 'Taxa cobrada pelo ML no reembolso';
COMMENT ON COLUMN public.devolucoes_avancadas.internal_tags IS 'Tags internas para categorização';
COMMENT ON COLUMN public.devolucoes_avancadas.tem_financeiro IS 'Indica se tem informações financeiras completas';
COMMENT ON COLUMN public.devolucoes_avancadas.tem_review IS 'Indica se tem review/mediação';
COMMENT ON COLUMN public.devolucoes_avancadas.tem_sla IS 'Indica se está dentro do SLA';
COMMENT ON COLUMN public.devolucoes_avancadas.nota_fiscal_autorizada IS 'Indica se nota fiscal foi autorizada';
COMMENT ON COLUMN public.devolucoes_avancadas.eficiencia_resolucao IS 'Eficiência da resolução (fast, normal, slow)';