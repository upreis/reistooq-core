-- ============================================================================
-- FASE 1: MIGRAÇÃO - Sistema de Análise de Devoluções com Auto-detecção
-- ============================================================================

-- 1. Adicionar novas colunas à tabela devolucoes_avancadas
ALTER TABLE public.devolucoes_avancadas
ADD COLUMN IF NOT EXISTS status_analise text DEFAULT 'pendente' CHECK (status_analise IN ('pendente', 'resolvido_sem_dinheiro', 'resolvido_com_dinheiro', 'em_analise', 'aguardando_ml', 'cancelado')),
ADD COLUMN IF NOT EXISTS data_status_analise timestamp with time zone,
ADD COLUMN IF NOT EXISTS usuario_status_analise uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS campos_atualizados jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao_real timestamp with time zone,
ADD COLUMN IF NOT EXISTS snapshot_anterior jsonb DEFAULT '{}'::jsonb;

-- 2. Criar índices para performance otimizada
CREATE INDEX IF NOT EXISTS idx_devolucoes_status_analise 
ON public.devolucoes_avancadas(status_analise) 
WHERE status_analise != 'resolvido_sem_dinheiro' AND status_analise != 'resolvido_com_dinheiro';

CREATE INDEX IF NOT EXISTS idx_devolucoes_ultima_atualizacao 
ON public.devolucoes_avancadas(ultima_atualizacao_real DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_devolucoes_account_status 
ON public.devolucoes_avancadas(integration_account_id, status_analise);

-- 3. Criar função de detecção automática de mudanças
CREATE OR REPLACE FUNCTION public.detect_devolucao_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campos_alterados jsonb := '[]'::jsonb;
  campo_nome text;
  campos_monitorados text[] := ARRAY[
    'status_devolucao',
    'valor_retido',
    'em_mediacao',
    'claim_fulfilled',
    'status_rastreamento',
    'transportadora',
    'codigo_rastreamento',
    'metodo_resolucao',
    'resultado_final',
    'review_status',
    'review_result',
    'ultima_mensagem_data',
    'data_fechamento_devolucao'
  ];
BEGIN
  -- Detectar mudanças nos campos monitorados
  FOREACH campo_nome IN ARRAY campos_monitorados
  LOOP
    IF (to_jsonb(OLD) -> campo_nome) IS DISTINCT FROM (to_jsonb(NEW) -> campo_nome) THEN
      campos_alterados := campos_alterados || jsonb_build_object(
        'campo', campo_nome,
        'valor_anterior', to_jsonb(OLD) -> campo_nome,
        'valor_novo', to_jsonb(NEW) -> campo_nome,
        'data_mudanca', now()
      );
    END IF;
  END LOOP;

  -- Se houve mudanças, atualizar metadados
  IF jsonb_array_length(campos_alterados) > 0 THEN
    NEW.campos_atualizados := campos_alterados;
    NEW.ultima_atualizacao_real := now();
    NEW.snapshot_anterior := to_jsonb(OLD);
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Criar trigger para auto-detecção
DROP TRIGGER IF EXISTS trigger_detect_changes ON public.devolucoes_avancadas;
CREATE TRIGGER trigger_detect_changes
  BEFORE UPDATE ON public.devolucoes_avancadas
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_devolucao_changes();

-- 5. Atualizar políticas RLS existentes (verificar permissões)
-- As políticas já existem para SELECT/INSERT/UPDATE/DELETE baseadas em integration_account_id
-- Não é necessário criar novas, apenas garantir que as colunas novas são acessíveis

-- 6. Comentários para documentação
COMMENT ON COLUMN public.devolucoes_avancadas.status_analise IS 'Status atual da análise da devolução (pendente, resolvido_sem_dinheiro, etc.)';
COMMENT ON COLUMN public.devolucoes_avancadas.campos_atualizados IS 'Array JSON com histórico de campos que foram alterados e quando';
COMMENT ON COLUMN public.devolucoes_avancadas.ultima_atualizacao_real IS 'Timestamp da última mudança real detectada pelo sistema';
COMMENT ON COLUMN public.devolucoes_avancadas.snapshot_anterior IS 'Snapshot completo do registro antes da última atualização';

-- 7. Inicializar dados existentes
UPDATE public.devolucoes_avancadas
SET ultima_atualizacao_real = updated_at
WHERE ultima_atualizacao_real IS NULL;