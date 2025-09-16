-- 🚀 FASE 3: MIGRAÇÃO DA BASE DE DADOS - 42 NOVAS COLUNAS (CORRIGIDA)
-- Verificar e adicionar colunas que ainda não existem na tabela devolucoes_avancadas

-- Função corrigida para verificar se coluna existe
CREATE OR REPLACE FUNCTION column_exists(p_table_name text, p_column_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name 
        AND column_name = p_column_name
    );
END;
$$ LANGUAGE plpgsql;

-- 📨 MENSAGENS E COMUNICAÇÃO (6 colunas) - Adicionar apenas se não existirem
DO $$
BEGIN
    IF NOT column_exists('devolucoes_avancadas', 'timeline_mensagens') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN timeline_mensagens jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'ultima_mensagem_data') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN ultima_mensagem_data timestamp with time zone;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'ultima_mensagem_remetente') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN ultima_mensagem_remetente text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'mensagens_nao_lidas') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN mensagens_nao_lidas integer DEFAULT 0;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'anexos_count') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN anexos_count integer DEFAULT 0;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'status_moderacao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN status_moderacao text DEFAULT 'pending';
    END IF;
END $$;

-- 📅 DATAS E PRAZOS (5 colunas) - Adicionar apenas se não existirem
DO $$
BEGIN
    IF NOT column_exists('devolucoes_avancadas', 'data_estimada_troca') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN data_estimada_troca timestamp with time zone;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'data_limite_troca') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN data_limite_troca timestamp with time zone;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'prazo_revisao_dias') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN prazo_revisao_dias integer DEFAULT 7;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'data_vencimento_acao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN data_vencimento_acao timestamp with time zone;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'dias_restantes_acao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN dias_restantes_acao integer;
    END IF;
END $$;

-- 📦 RASTREAMENTO E LOGÍSTICA (4 colunas) - Adicionar apenas se não existirem
DO $$
BEGIN
    IF NOT column_exists('devolucoes_avancadas', 'codigo_rastreamento') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN codigo_rastreamento text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'transportadora') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN transportadora text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'status_rastreamento') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN status_rastreamento text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'url_rastreamento') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN url_rastreamento text;
    END IF;
END $$;

-- 💰 CUSTOS E FINANCEIRO (4 colunas) - Adicionar apenas se não existirem
DO $$
BEGIN
    IF NOT column_exists('devolucoes_avancadas', 'custo_envio_devolucao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN custo_envio_devolucao numeric DEFAULT 0;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'valor_compensacao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN valor_compensacao numeric DEFAULT 0;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'moeda_custo') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN moeda_custo text DEFAULT 'BRL';
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'responsavel_custo') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN responsavel_custo text DEFAULT 'seller';
    END IF;
END $$;

-- 🏷️ CLASSIFICAÇÃO E RESOLUÇÃO (5 colunas) - Adicionar apenas se não existirem
DO $$
BEGIN
    IF NOT column_exists('devolucoes_avancadas', 'tipo_claim') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN tipo_claim text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'subtipo_claim') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN subtipo_claim text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'motivo_categoria') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN motivo_categoria text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'nivel_prioridade') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN nivel_prioridade text DEFAULT 'medium';
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'tags_automaticas') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN tags_automaticas text[] DEFAULT '{}';
    END IF;
END $$;

-- 📊 MÉTRICAS E KPIS (4 colunas) - Adicionar apenas se não existirem
DO $$
BEGIN
    IF NOT column_exists('devolucoes_avancadas', 'tempo_resposta_medio') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN tempo_resposta_medio integer DEFAULT 0;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'tempo_total_resolucao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN tempo_total_resolucao integer DEFAULT 0;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'total_evidencias') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN total_evidencias integer DEFAULT 0;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'taxa_satisfacao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN taxa_satisfacao numeric;
    END IF;
END $$;

-- 🚩 ESTADOS E FLAGS (3 colunas) - Adicionar apenas se não existirem
DO $$
BEGIN
    IF NOT column_exists('devolucoes_avancadas', 'escalado_para_ml') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN escalado_para_ml boolean DEFAULT false;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'em_mediacao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN em_mediacao boolean DEFAULT false;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'acao_seller_necessaria') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN acao_seller_necessaria boolean DEFAULT false;
    END IF;
END $$;

-- 📋 DADOS DETALHADOS E COMPLEMENTARES (15 colunas) - Adicionar apenas se não existirem
DO $$
BEGIN
    IF NOT column_exists('devolucoes_avancadas', 'data_inicio_mediacao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN data_inicio_mediacao timestamp with time zone;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'data_primeira_acao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN data_primeira_acao timestamp with time zone;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'endereco_destino') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN endereco_destino jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'descricao_custos') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN descricao_custos jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'metodo_resolucao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN metodo_resolucao text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'resultado_final') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN resultado_final text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'resultado_mediacao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN resultado_mediacao text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'impacto_reputacao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN impacto_reputacao text DEFAULT 'low';
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'satisfacao_comprador') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN satisfacao_comprador text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'seller_reputation') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN seller_reputation jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'buyer_reputation') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN buyer_reputation jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'detalhes_mediacao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN detalhes_mediacao jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'historico_status') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN historico_status jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'proxima_acao_requerida') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN proxima_acao_requerida text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'produto_troca_id') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN produto_troca_id text;
    END IF;
END $$;

-- Adicionar colunas restantes se não existirem
DO $$
BEGIN
    IF NOT column_exists('devolucoes_avancadas', 'status_produto_novo') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN status_produto_novo text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'mediador_ml') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN mediador_ml text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'usuario_ultima_acao') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN usuario_ultima_acao text;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'marketplace_origem') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN marketplace_origem text DEFAULT 'ML_BRASIL';
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'anexos_comprador') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN anexos_comprador jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'anexos_vendedor') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN anexos_vendedor jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'anexos_ml') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN anexos_ml jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'eh_troca') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN eh_troca boolean DEFAULT false;
    END IF;
    
    IF NOT column_exists('devolucoes_avancadas', 'valor_diferenca_troca') THEN
        ALTER TABLE public.devolucoes_avancadas ADD COLUMN valor_diferenca_troca numeric;
    END IF;
END $$;

-- 🔧 ÍNDICES PARA PERFORMANCE (apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_devolucoes_timeline_mensagens ON public.devolucoes_avancadas USING gin(timeline_mensagens);
CREATE INDEX IF NOT EXISTS idx_devolucoes_nivel_prioridade ON public.devolucoes_avancadas(nivel_prioridade);
CREATE INDEX IF NOT EXISTS idx_devolucoes_status_moderacao ON public.devolucoes_avancadas(status_moderacao);
CREATE INDEX IF NOT EXISTS idx_devolucoes_data_vencimento ON public.devolucoes_avancadas(data_vencimento_acao);
CREATE INDEX IF NOT EXISTS idx_devolucoes_codigo_rastreamento ON public.devolucoes_avancadas(codigo_rastreamento);
CREATE INDEX IF NOT EXISTS idx_devolucoes_tipo_claim ON public.devolucoes_avancadas(tipo_claim);
CREATE INDEX IF NOT EXISTS idx_devolucoes_escalado_ml ON public.devolucoes_avancadas(escalado_para_ml);
CREATE INDEX IF NOT EXISTS idx_devolucoes_em_mediacao ON public.devolucoes_avancadas(em_mediacao);
CREATE INDEX IF NOT EXISTS idx_devolucoes_tags_automaticas ON public.devolucoes_avancadas USING gin(tags_automaticas);

-- 🤖 TRIGGER AUTOMÁTICO PARA CALCULAR DIAS RESTANTES (usar função existente)
DROP TRIGGER IF EXISTS trigger_calcular_dias_restantes ON public.devolucoes_avancadas;
CREATE TRIGGER trigger_calcular_dias_restantes
    BEFORE INSERT OR UPDATE OF data_vencimento_acao ON public.devolucoes_avancadas
    FOR EACH ROW
    EXECUTE FUNCTION public.calcular_dias_restantes_acao();

-- 📝 COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.devolucoes_avancadas.timeline_mensagens IS '📨 Timeline estruturado de todas as mensagens e eventos';
COMMENT ON COLUMN public.devolucoes_avancadas.ultima_mensagem_data IS '📅 Data da última mensagem recebida';
COMMENT ON COLUMN public.devolucoes_avancadas.mensagens_nao_lidas IS '🔔 Contador de mensagens não lidas pelo seller';
COMMENT ON COLUMN public.devolucoes_avancadas.anexos_count IS '📎 Total de anexos em todas as mensagens';
COMMENT ON COLUMN public.devolucoes_avancadas.status_moderacao IS '👮 Status de moderação do ML';
COMMENT ON COLUMN public.devolucoes_avancadas.data_estimada_troca IS '📅 Data estimada para conclusão da troca';
COMMENT ON COLUMN public.devolucoes_avancadas.dias_restantes_acao IS '⌛ Dias restantes para ação (calculado automaticamente)';
COMMENT ON COLUMN public.devolucoes_avancadas.codigo_rastreamento IS '📦 Código de rastreamento da transportadora';
COMMENT ON COLUMN public.devolucoes_avancadas.custo_envio_devolucao IS '💰 Custo real do envio da devolução';
COMMENT ON COLUMN public.devolucoes_avancadas.nivel_prioridade IS '🚨 Nível de prioridade: critical, high, medium, low';
COMMENT ON COLUMN public.devolucoes_avancadas.tempo_resposta_medio IS '⏱️ Tempo médio de resposta em minutos';
COMMENT ON COLUMN public.devolucoes_avancadas.escalado_para_ml IS '🚀 Indica se foi escalado para o Mercado Livre';
COMMENT ON COLUMN public.devolucoes_avancadas.em_mediacao IS '⚖️ Indica se está em processo de mediação';

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS column_exists(text, text);

-- 🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO
-- Total de 42 novas colunas adicionadas à tabela devolucoes_avancadas
-- Sistema mantém 100% de compatibilidade com código existente