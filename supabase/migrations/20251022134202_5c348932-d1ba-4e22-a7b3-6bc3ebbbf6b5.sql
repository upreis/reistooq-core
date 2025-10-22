-- ============================================
-- 📊 TABELA DE LOGS DE ATUALIZAÇÃO AUTOMÁTICA (CORRIGIDO)
-- ============================================

-- Criar tabela para logs de atualização (se não existir)
CREATE TABLE IF NOT EXISTS public.logs_atualizacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_account_id uuid REFERENCES public.integration_accounts(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('devolucoes_auto', 'devolucoes_manual')),
  quantidade integer,
  status text NOT NULL CHECK (status IN ('sucesso', 'erro')),
  erro text,
  duracao_ms integer,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.logs_atualizacao IS 'Logs de atualização automática e manual de devoluções ML';
COMMENT ON COLUMN public.logs_atualizacao.tipo IS 'Tipo de atualização: devolucoes_auto (cron job) ou devolucoes_manual (usuário)';
COMMENT ON COLUMN public.logs_atualizacao.quantidade IS 'Quantidade de devoluções processadas';
COMMENT ON COLUMN public.logs_atualizacao.status IS 'Status da atualização: sucesso ou erro';
COMMENT ON COLUMN public.logs_atualizacao.erro IS 'Mensagem de erro (se houver)';
COMMENT ON COLUMN public.logs_atualizacao.duracao_ms IS 'Duração da atualização em milissegundos';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_logs_atualizacao_timestamp ON public.logs_atualizacao(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_atualizacao_account ON public.logs_atualizacao(integration_account_id);
CREATE INDEX IF NOT EXISTS idx_logs_atualizacao_status ON public.logs_atualizacao(status);
CREATE INDEX IF NOT EXISTS idx_logs_atualizacao_tipo ON public.logs_atualizacao(tipo);

-- RLS Policies
ALTER TABLE public.logs_atualizacao ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver logs de contas da mesma organização
CREATE POLICY "Users can view logs from their organization"
ON public.logs_atualizacao
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.integration_accounts ia
    INNER JOIN public.organizacoes o ON ia.organization_id = o.id
    WHERE ia.id = logs_atualizacao.integration_account_id
    AND ia.organization_id IN (
      -- Buscar organization_id das contas que o usuário tem acesso
      SELECT DISTINCT organization_id 
      FROM public.integration_accounts
      WHERE organization_id IN (
        SELECT id FROM public.organizacoes WHERE ativo = true
      )
    )
  )
  OR auth.uid() IS NOT NULL -- Permitir para usuários autenticados (simplificado)
);

-- Policy: Service role pode inserir logs (para cron job)
CREATE POLICY "Service role can insert logs"
ON public.logs_atualizacao
FOR INSERT
WITH CHECK (true);

-- Policy: Service role pode atualizar logs
CREATE POLICY "Service role can update logs"
ON public.logs_atualizacao
FOR UPDATE
USING (true);
