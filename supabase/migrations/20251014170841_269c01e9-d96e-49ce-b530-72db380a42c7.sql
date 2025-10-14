-- ============================================
-- FASE 3: CAMPOS AVANÇADOS
-- Adicionando 15 campos para análise detalhada
-- ============================================

-- 1. CUSTOS DETALHADOS (5 campos)
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS custo_frete_devolucao NUMERIC;
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS custo_logistica_total NUMERIC;
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS valor_original_produto NUMERIC;
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS valor_reembolsado_produto NUMERIC;
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS taxa_ml_reembolso NUMERIC;

-- 2. INTERNAL TAGS E METADADOS (5 campos)
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS internal_tags TEXT[];
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS tem_financeiro BOOLEAN DEFAULT FALSE;
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS tem_review BOOLEAN DEFAULT FALSE;
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS tem_sla BOOLEAN DEFAULT FALSE;
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS nota_fiscal_autorizada BOOLEAN DEFAULT FALSE;

-- 3. DADOS DE PRODUTO (3 campos)
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS produto_warranty TEXT;
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS produto_categoria TEXT;
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS produto_thumbnail TEXT;

-- 4. ANÁLISE E QUALIDADE (2 campos)
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS qualidade_comunicacao TEXT;
ALTER TABLE public.pedidos_cancelados_ml ADD COLUMN IF NOT EXISTS eficiencia_resolucao TEXT;

-- Índices para performance dos novos campos
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_internal_tags ON public.pedidos_cancelados_ml USING GIN(internal_tags);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_tem_financeiro ON public.pedidos_cancelados_ml(tem_financeiro);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_tem_review ON public.pedidos_cancelados_ml(tem_review);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_produto_categoria ON public.pedidos_cancelados_ml(produto_categoria);

-- Comentários de documentação para FASE 3
COMMENT ON COLUMN public.pedidos_cancelados_ml.custo_frete_devolucao IS 'Custo do frete de devolução do produto';
COMMENT ON COLUMN public.pedidos_cancelados_ml.custo_logistica_total IS 'Custo total de logística (envio + devolução)';
COMMENT ON COLUMN public.pedidos_cancelados_ml.valor_original_produto IS 'Valor original do produto antes de descontos';
COMMENT ON COLUMN public.pedidos_cancelados_ml.valor_reembolsado_produto IS 'Valor efetivamente reembolsado do produto';
COMMENT ON COLUMN public.pedidos_cancelados_ml.taxa_ml_reembolso IS 'Taxa cobrada pelo Mercado Livre no reembolso';
COMMENT ON COLUMN public.pedidos_cancelados_ml.internal_tags IS 'Tags internas para categorização e filtros';
COMMENT ON COLUMN public.pedidos_cancelados_ml.tem_financeiro IS 'Indica se tem informações financeiras completas';
COMMENT ON COLUMN public.pedidos_cancelados_ml.tem_review IS 'Indica se tem review/mediação';
COMMENT ON COLUMN public.pedidos_cancelados_ml.tem_sla IS 'Indica se está dentro do SLA';
COMMENT ON COLUMN public.pedidos_cancelados_ml.nota_fiscal_autorizada IS 'Indica se a nota fiscal foi autorizada';
COMMENT ON COLUMN public.pedidos_cancelados_ml.produto_warranty IS 'Garantia do produto';
COMMENT ON COLUMN public.pedidos_cancelados_ml.produto_categoria IS 'Categoria do produto no Mercado Livre';
COMMENT ON COLUMN public.pedidos_cancelados_ml.produto_thumbnail IS 'URL da thumbnail do produto';
COMMENT ON COLUMN public.pedidos_cancelados_ml.qualidade_comunicacao IS 'Qualidade da comunicação (excellent, good, fair, poor)';
COMMENT ON COLUMN public.pedidos_cancelados_ml.eficiencia_resolucao IS 'Eficiência da resolução (fast, normal, slow)';