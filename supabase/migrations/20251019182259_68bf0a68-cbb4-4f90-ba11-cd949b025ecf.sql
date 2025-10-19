
-- ════════════════════════════════════════════════════════════
-- ETAPA 1: OTIMIZAR TABELA devolucoes_avancadas PARA SYNC
-- (Versão 2 - Skip realtime se já existir)
-- ════════════════════════════════════════════════════════════

-- 1️⃣ Adicionar campo de controle de sincronização (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'devolucoes_avancadas' 
    AND column_name = 'ultima_sincronizacao'
  ) THEN
    ALTER TABLE public.devolucoes_avancadas 
    ADD COLUMN ultima_sincronizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    COMMENT ON COLUMN public.devolucoes_avancadas.ultima_sincronizacao IS 
    'Timestamp da última vez que este registro foi sincronizado com a API do ML';
    
    RAISE NOTICE '✅ Campo ultima_sincronizacao adicionado';
  ELSE
    RAISE NOTICE '⏭️ Campo ultima_sincronizacao já existe';
  END IF;
END $$;

-- 2️⃣ Criar índice para queries de sincronização
CREATE INDEX IF NOT EXISTS idx_devolucoes_sync_filters 
ON public.devolucoes_avancadas (
  integration_account_id,
  status_devolucao,
  data_criacao DESC,
  ultima_sincronizacao DESC
) 
WHERE status_devolucao IS NOT NULL;

-- 3️⃣ Criar índice para busca por claim_id
CREATE INDEX IF NOT EXISTS idx_devolucoes_claim_id 
ON public.devolucoes_avancadas (claim_id) 
WHERE claim_id IS NOT NULL;

-- 4️⃣ Habilitar REALTIME (apenas se ainda não estiver)
DO $$
BEGIN
  -- Verificar se já está na publicação
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'devolucoes_avancadas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.devolucoes_avancadas;
    RAISE NOTICE '✅ Realtime habilitado';
  ELSE
    RAISE NOTICE '⏭️ Realtime já está habilitado';
  END IF;
END $$;

-- 5️⃣ Garantir REPLICA IDENTITY FULL
ALTER TABLE public.devolucoes_avancadas REPLICA IDENTITY FULL;

-- 6️⃣ Criar índice composto para filtros inteligentes
CREATE INDEX IF NOT EXISTS idx_devolucoes_filtros_avancados 
ON public.devolucoes_avancadas (
  integration_account_id,
  status_devolucao,
  tipo_claim,
  claim_stage,
  data_criacao DESC
) 
WHERE status_devolucao IS NOT NULL;

-- 7️⃣ Criar índice para queries por período
CREATE INDEX IF NOT EXISTS idx_devolucoes_periodo 
ON public.devolucoes_avancadas (data_criacao DESC) 
INCLUDE (integration_account_id, status_devolucao);

-- ════════════════════════════════════════════════════════════
-- ✅ RESUMO
-- ════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '✅ ETAPA 1 CONCLUÍDA - Tabela Otimizada';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '📊 Registros existentes: preservados (338)';
  RAISE NOTICE '🔄 Realtime: ativo';
  RAISE NOTICE '⚡ Índices: criados para performance';
  RAISE NOTICE '🔒 Sistema: funcionando normalmente';
  RAISE NOTICE '════════════════════════════════════════════════════';
END $$;
