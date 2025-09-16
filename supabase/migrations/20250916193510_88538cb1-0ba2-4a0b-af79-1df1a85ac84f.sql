-- FASE 1: Enriquecimento de Devoluções ML - Análise e Estruturação
-- Adicionando todas as novas colunas mantendo compatibilidade total
-- Usando ADD COLUMN IF NOT EXISTS para evitar conflitos

-- ============================================
-- MENSAGENS E COMUNICAÇÃO
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS timeline_mensagens JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ultima_mensagem_data TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ultima_mensagem_remetente TEXT,
ADD COLUMN IF NOT EXISTS mensagens_nao_lidas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS anexos_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status_moderacao TEXT;

-- ============================================
-- DATAS E PRAZOS
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS data_estimada_troca TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data_limite_troca TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS prazo_revisao_dias INTEGER,
ADD COLUMN IF NOT EXISTS data_vencimento_acao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dias_restantes_acao INTEGER;

-- ============================================
-- RASTREAMENTO E LOGÍSTICA
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS codigo_rastreamento TEXT,
ADD COLUMN IF NOT EXISTS transportadora TEXT,
ADD COLUMN IF NOT EXISTS endereco_destino JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS status_rastreamento TEXT,
ADD COLUMN IF NOT EXISTS url_rastreamento TEXT;

-- ============================================
-- CUSTOS E FINANCEIRO
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS custo_envio_devolucao DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS moeda_custo TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS responsavel_custo TEXT,
ADD COLUMN IF NOT EXISTS valor_compensacao DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS descricao_custos JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- TIPOS E CLASSIFICAÇÃO
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS tipo_claim TEXT,
ADD COLUMN IF NOT EXISTS subtipo_claim TEXT,
ADD COLUMN IF NOT EXISTS motivo_categoria TEXT,
ADD COLUMN IF NOT EXISTS nivel_prioridade TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS tags_automaticas TEXT[] DEFAULT '{}';

-- ============================================
-- RESOLUÇÃO E RESULTADO
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS metodo_resolucao TEXT,
ADD COLUMN IF NOT EXISTS resultado_final TEXT,
ADD COLUMN IF NOT EXISTS satisfacao_comprador TEXT,
ADD COLUMN IF NOT EXISTS acao_seller_necessaria BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS proxima_acao_requerida TEXT;

-- ============================================
-- DADOS DE TROCA (CHANGES)
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS eh_troca BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS produto_troca_id TEXT,
ADD COLUMN IF NOT EXISTS valor_diferenca_troca DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS status_produto_novo TEXT;

-- ============================================
-- MEDIAÇÃO E DISPUTA
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS em_mediacao BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_inicio_mediacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mediador_ml TEXT,
ADD COLUMN IF NOT EXISTS resultado_mediacao TEXT,
ADD COLUMN IF NOT EXISTS detalhes_mediacao JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- ANEXOS E EVIDÊNCIAS
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS anexos_comprador JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS anexos_vendedor JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS anexos_ml JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_evidencias INTEGER DEFAULT 0;

-- ============================================
-- HISTÓRICO E AUDITORIA
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS historico_status JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS data_primeira_acao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS usuario_ultima_acao TEXT,
ADD COLUMN IF NOT EXISTS tempo_resposta_medio INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS escalado_para_ml BOOLEAN DEFAULT false;

-- ============================================
-- ACCOUNT E CONTEXTO
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS seller_reputation JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS buyer_reputation JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS marketplace_origem TEXT DEFAULT 'ML_BRASIL';

-- ============================================
-- MÉTRICAS E KPIs
-- ============================================
ALTER TABLE devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS tempo_total_resolucao INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS numero_interacoes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS taxa_satisfacao DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS impacto_reputacao TEXT DEFAULT 'low';

-- ============================================
-- ÍNDICES PARA PERFORMANCE (com verificação de existência)
-- ============================================

-- Função para criar índice apenas se não existir
DO $$
BEGIN
    -- Índices para campos de busca frequente
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_devolucoes_codigo_rastreamento') THEN
        CREATE INDEX idx_devolucoes_codigo_rastreamento 
        ON devolucoes_avancadas(codigo_rastreamento) 
        WHERE codigo_rastreamento IS NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_devolucoes_data_vencimento') THEN
        CREATE INDEX idx_devolucoes_data_vencimento 
        ON devolucoes_avancadas(data_vencimento_acao) 
        WHERE data_vencimento_acao IS NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_devolucoes_em_mediacao') THEN
        CREATE INDEX idx_devolucoes_em_mediacao 
        ON devolucoes_avancadas(em_mediacao) 
        WHERE em_mediacao = true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_devolucoes_acao_necessaria') THEN
        CREATE INDEX idx_devolucoes_acao_necessaria 
        ON devolucoes_avancadas(acao_seller_necessaria) 
        WHERE acao_seller_necessaria = true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_devolucoes_nivel_prioridade') THEN
        CREATE INDEX idx_devolucoes_nivel_prioridade 
        ON devolucoes_avancadas(nivel_prioridade);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_devolucoes_tipo_claim') THEN
        CREATE INDEX idx_devolucoes_tipo_claim 
        ON devolucoes_avancadas(tipo_claim) 
        WHERE tipo_claim IS NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_devolucoes_eh_troca') THEN
        CREATE INDEX idx_devolucoes_eh_troca 
        ON devolucoes_avancadas(eh_troca) 
        WHERE eh_troca = true;
    END IF;

    -- Índices compostos
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_devolucoes_status_prioridade') THEN
        CREATE INDEX idx_devolucoes_status_prioridade 
        ON devolucoes_avancadas(status_devolucao, nivel_prioridade);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_devolucoes_account_status') THEN
        CREATE INDEX idx_devolucoes_account_status 
        ON devolucoes_avancadas(integration_account_id, status_devolucao, created_at DESC);
    END IF;
END $$;

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

-- Remover trigger existente se houver e criar novo
DROP TRIGGER IF EXISTS trigger_calcular_dias_restantes ON devolucoes_avancadas;
CREATE TRIGGER trigger_calcular_dias_restantes
  BEFORE INSERT OR UPDATE ON devolucoes_avancadas
  FOR EACH ROW
  EXECUTE FUNCTION calcular_dias_restantes_acao();