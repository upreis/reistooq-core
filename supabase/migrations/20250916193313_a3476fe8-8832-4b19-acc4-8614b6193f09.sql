-- FASE 1: Enriquecimento de Devoluções ML - Análise e Estruturação
-- Adicionando todas as novas colunas mantendo compatibilidade total

-- ============================================
-- MENSAGENS E COMUNICAÇÃO
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN timeline_mensagens JSONB DEFAULT '[]'::jsonb,
ADD COLUMN ultima_mensagem_data TIMESTAMP WITH TIME ZONE,
ADD COLUMN ultima_mensagem_remetente TEXT,
ADD COLUMN mensagens_nao_lidas INTEGER DEFAULT 0,
ADD COLUMN anexos_count INTEGER DEFAULT 0,
ADD COLUMN status_moderacao TEXT;

-- ============================================
-- DATAS E PRAZOS
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN data_estimada_troca TIMESTAMP WITH TIME ZONE,
ADD COLUMN data_limite_troca TIMESTAMP WITH TIME ZONE,
ADD COLUMN prazo_revisao_dias INTEGER,
ADD COLUMN data_vencimento_acao TIMESTAMP WITH TIME ZONE,
ADD COLUMN dias_restantes_acao INTEGER;

-- ============================================
-- RASTREAMENTO E LOGÍSTICA
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN codigo_rastreamento TEXT,
ADD COLUMN transportadora TEXT,
ADD COLUMN endereco_destino JSONB DEFAULT '{}'::jsonb,
ADD COLUMN status_rastreamento TEXT,
ADD COLUMN url_rastreamento TEXT;

-- ============================================
-- CUSTOS E FINANCEIRO
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN custo_envio_devolucao DECIMAL(10,2),
ADD COLUMN moeda_custo TEXT DEFAULT 'BRL',
ADD COLUMN responsavel_custo TEXT,
ADD COLUMN valor_compensacao DECIMAL(10,2),
ADD COLUMN descricao_custos JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- TIPOS E CLASSIFICAÇÃO
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN tipo_claim TEXT,
ADD COLUMN subtipo_claim TEXT,
ADD COLUMN motivo_categoria TEXT,
ADD COLUMN nivel_prioridade TEXT DEFAULT 'medium',
ADD COLUMN tags_automaticas TEXT[] DEFAULT '{}';

-- ============================================
-- RESOLUÇÃO E RESULTADO
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN metodo_resolucao TEXT,
ADD COLUMN resultado_final TEXT,
ADD COLUMN satisfacao_comprador TEXT,
ADD COLUMN acao_seller_necessaria BOOLEAN DEFAULT false,
ADD COLUMN proxima_acao_requerida TEXT;

-- ============================================
-- DADOS DE TROCA (CHANGES)
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN eh_troca BOOLEAN DEFAULT false,
ADD COLUMN produto_troca_id TEXT,
ADD COLUMN valor_diferenca_troca DECIMAL(10,2),
ADD COLUMN status_produto_novo TEXT;

-- ============================================
-- MEDIAÇÃO E DISPUTA
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN em_mediacao BOOLEAN DEFAULT false,
ADD COLUMN data_inicio_mediacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN mediador_ml TEXT,
ADD COLUMN resultado_mediacao TEXT,
ADD COLUMN detalhes_mediacao JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- ANEXOS E EVIDÊNCIAS
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN anexos_comprador JSONB DEFAULT '[]'::jsonb,
ADD COLUMN anexos_vendedor JSONB DEFAULT '[]'::jsonb,
ADD COLUMN anexos_ml JSONB DEFAULT '[]'::jsonb,
ADD COLUMN total_evidencias INTEGER DEFAULT 0;

-- ============================================
-- HISTÓRICO E AUDITORIA
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN historico_status JSONB DEFAULT '[]'::jsonb,
ADD COLUMN data_primeira_acao TIMESTAMP WITH TIME ZONE,
ADD COLUMN usuario_ultima_acao TEXT,
ADD COLUMN tempo_resposta_medio INTEGER DEFAULT 0,
ADD COLUMN escalado_para_ml BOOLEAN DEFAULT false;

-- ============================================
-- ACCOUNT E CONTEXTO
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN account_name TEXT,
ADD COLUMN seller_reputation JSONB DEFAULT '{}'::jsonb,
ADD COLUMN buyer_reputation JSONB DEFAULT '{}'::jsonb,
ADD COLUMN marketplace_origem TEXT DEFAULT 'ML_BRASIL';

-- ============================================
-- MÉTRICAS E KPIs
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN tempo_total_resolucao INTEGER DEFAULT 0,
ADD COLUMN numero_interacoes INTEGER DEFAULT 0,
ADD COLUMN taxa_satisfacao DECIMAL(3,2),
ADD COLUMN impacto_reputacao TEXT DEFAULT 'low';

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para campos de busca frequente
CREATE INDEX IF NOT EXISTS idx_devolucoes_codigo_rastreamento 
ON devolucoes_avancadas(codigo_rastreamento) 
WHERE codigo_rastreamento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_devolucoes_data_vencimento 
ON devolucoes_avancadas(data_vencimento_acao) 
WHERE data_vencimento_acao IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_devolucoes_em_mediacao 
ON devolucoes_avancadas(em_mediacao) 
WHERE em_mediacao = true;

CREATE INDEX IF NOT EXISTS idx_devolucoes_acao_necessaria 
ON devolucoes_avancadas(acao_seller_necessaria) 
WHERE acao_seller_necessaria = true;

CREATE INDEX IF NOT EXISTS idx_devolucoes_nivel_prioridade 
ON devolucoes_avancadas(nivel_prioridade);

CREATE INDEX IF NOT EXISTS idx_devolucoes_tipo_claim 
ON devolucoes_avancadas(tipo_claim) 
WHERE tipo_claim IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_devolucoes_eh_troca 
ON devolucoes_avancadas(eh_troca) 
WHERE eh_troca = true;

-- Índices compostos para queries complexas
CREATE INDEX IF NOT EXISTS idx_devolucoes_status_prioridade 
ON devolucoes_avancadas(status_devolucao, nivel_prioridade);

CREATE INDEX IF NOT EXISTS idx_devolucoes_account_status 
ON devolucoes_avancadas(integration_account_id, status_devolucao, created_at DESC);

-- ============================================
-- TRIGGER PARA CALCULAR DIAS RESTANTES
-- ============================================

CREATE OR REPLACE FUNCTION calcular_dias_restantes_acao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_vencimento_acao IS NOT NULL THEN
    NEW.dias_restantes_acao := EXTRACT(DAY FROM (NEW.data_vencimento_acao - NOW()));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_dias_restantes
  BEFORE INSERT OR UPDATE ON devolucoes_avancadas
  FOR EACH ROW
  EXECUTE FUNCTION calcular_dias_restantes_acao();

-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON COLUMN devolucoes_avancadas.timeline_mensagens IS 'Array estruturado de mensagens do claim';
COMMENT ON COLUMN devolucoes_avancadas.codigo_rastreamento IS 'Código de rastreamento da devolução';
COMMENT ON COLUMN devolucoes_avancadas.custo_envio_devolucao IS 'Custo real do envio da devolução';
COMMENT ON COLUMN devolucoes_avancadas.tipo_claim IS 'Tipo específico do claim (warranty, not_received, etc)';
COMMENT ON COLUMN devolucoes_avancadas.em_mediacao IS 'Indica se o caso está em processo de mediação';
COMMENT ON COLUMN devolucoes_avancadas.acao_seller_necessaria IS 'Indica se o vendedor precisa tomar alguma ação';
COMMENT ON COLUMN devolucoes_avancadas.eh_troca IS 'Indica se é uma troca em vez de devolução';
COMMENT ON COLUMN devolucoes_avancadas.tempo_total_resolucao IS 'Tempo total para resolver o caso (em horas)';
COMMENT ON COLUMN devolucoes_avancadas.nivel_prioridade IS 'Nível de prioridade: low, medium, high, urgent';
COMMENT ON COLUMN devolucoes_avancadas.dias_restantes_acao IS 'Dias restantes para tomar ação (calculado automaticamente)';