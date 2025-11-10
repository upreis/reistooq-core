-- ✅ TABELA: Notificações de Devoluções
CREATE TABLE IF NOT EXISTS public.devolucoes_notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  integration_account_id UUID NOT NULL REFERENCES public.integration_accounts(id) ON DELETE CASCADE,
  
  -- Dados da devolução
  order_id TEXT NOT NULL,
  return_id INTEGER NOT NULL,
  claim_id INTEGER NOT NULL,
  
  -- Tipo e prioridade da notificação
  tipo_notificacao TEXT NOT NULL CHECK (tipo_notificacao IN (
    'prazo_envio_critico',      -- < 24h para envio
    'prazo_envio_urgente',      -- < 48h para envio
    'prazo_review_critico',     -- < 24h para revisão
    'prazo_review_urgente',     -- < 48h para revisão
    'prazo_recebimento',        -- Previsto recebimento hoje
    'acao_necessaria'           -- Ação do vendedor necessária
  )),
  
  prioridade TEXT NOT NULL CHECK (prioridade IN ('critica', 'alta', 'media', 'baixa')) DEFAULT 'media',
  
  -- Detalhes da notificação
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  dados_contexto JSONB DEFAULT '{}'::jsonb,
  
  -- Prazos
  deadline_date TIMESTAMPTZ,
  horas_restantes INTEGER,
  
  -- Status
  lida BOOLEAN DEFAULT false,
  lida_em TIMESTAMPTZ,
  lida_por UUID REFERENCES auth.users(id),
  
  resolvida BOOLEAN DEFAULT false,
  resolvida_em TIMESTAMPTZ,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  
  -- Índices para performance
  CONSTRAINT unique_notificacao_devolucao UNIQUE (order_id, tipo_notificacao, organization_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_devolucoes_notificacoes_org ON public.devolucoes_notificacoes(organization_id);
CREATE INDEX IF NOT EXISTS idx_devolucoes_notificacoes_account ON public.devolucoes_notificacoes(integration_account_id);
CREATE INDEX IF NOT EXISTS idx_devolucoes_notificacoes_lida ON public.devolucoes_notificacoes(lida) WHERE lida = false;
CREATE INDEX IF NOT EXISTS idx_devolucoes_notificacoes_prioridade ON public.devolucoes_notificacoes(prioridade, lida);
CREATE INDEX IF NOT EXISTS idx_devolucoes_notificacoes_created ON public.devolucoes_notificacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devolucoes_notificacoes_expires ON public.devolucoes_notificacoes(expires_at);

-- RLS
ALTER TABLE public.devolucoes_notificacoes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários veem apenas notificações da sua organização
CREATE POLICY "Users can view notifications from their organization"
  ON public.devolucoes_notificacoes
  FOR SELECT
  USING (organization_id = public.get_current_org_id());

-- Política: Sistema pode inserir notificações
CREATE POLICY "System can insert notifications"
  ON public.devolucoes_notificacoes
  FOR INSERT
  WITH CHECK (true);

-- Política: Usuários podem atualizar suas notificações
CREATE POLICY "Users can update their organization notifications"
  ON public.devolucoes_notificacoes
  FOR UPDATE
  USING (organization_id = public.get_current_org_id());

-- Política: Sistema pode deletar notificações expiradas
CREATE POLICY "System can delete expired notifications"
  ON public.devolucoes_notificacoes
  FOR DELETE
  USING (expires_at < now());

-- ✅ FUNÇÃO: Marcar notificação como lida
CREATE OR REPLACE FUNCTION public.marcar_notificacao_lida(p_notificacao_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  v_org_id := public.get_current_org_id();
  
  UPDATE public.devolucoes_notificacoes
  SET 
    lida = true,
    lida_em = now(),
    lida_por = auth.uid()
  WHERE id = p_notificacao_id
    AND organization_id = v_org_id
    AND lida = false;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Notificação não encontrada');
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;

-- ✅ FUNÇÃO: Marcar todas como lidas
CREATE OR REPLACE FUNCTION public.marcar_todas_notificacoes_lidas()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_count INTEGER;
BEGIN
  v_org_id := public.get_current_org_id();
  
  UPDATE public.devolucoes_notificacoes
  SET 
    lida = true,
    lida_em = now(),
    lida_por = auth.uid()
  WHERE organization_id = v_org_id
    AND lida = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN json_build_object('success', true, 'marked', v_count);
END;
$$;

-- ✅ FUNÇÃO: Limpar notificações expiradas
CREATE OR REPLACE FUNCTION public.limpar_notificacoes_expiradas()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.devolucoes_notificacoes
  WHERE expires_at < now()
    OR (lida = true AND lida_em < now() - interval '30 days');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN json_build_object('success', true, 'deleted', v_count);
END;
$$;

-- ✅ FUNÇÃO: Obter contagem de notificações não lidas
CREATE OR REPLACE FUNCTION public.get_notificacoes_nao_lidas_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.devolucoes_notificacoes
  WHERE organization_id = public.get_current_org_id()
    AND lida = false
    AND expires_at > now();
$$;