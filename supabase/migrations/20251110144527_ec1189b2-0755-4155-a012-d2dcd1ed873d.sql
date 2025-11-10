-- Criar tabela de histórico de ações de devoluções
CREATE TABLE public.ml_devolucoes_historico_acoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id BIGINT NOT NULL,
  claim_id BIGINT NOT NULL,
  integration_account_id TEXT NOT NULL,
  
  -- Dados da ação
  action_type TEXT NOT NULL,
  action_name TEXT NOT NULL,
  action_status TEXT NOT NULL DEFAULT 'success',
  
  -- Dados adicionais (razão, mensagem, etc)
  action_data JSONB,
  
  -- Resposta da API
  api_response JSONB,
  
  -- Auditoria
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ml_devolucoes_historico_acoes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários autenticados podem ver histórico" 
ON public.ml_devolucoes_historico_acoes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir histórico" 
ON public.ml_devolucoes_historico_acoes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Índices para performance
CREATE INDEX idx_ml_historico_return_id ON public.ml_devolucoes_historico_acoes(return_id);
CREATE INDEX idx_ml_historico_claim_id ON public.ml_devolucoes_historico_acoes(claim_id);
CREATE INDEX idx_ml_historico_account_id ON public.ml_devolucoes_historico_acoes(integration_account_id);
CREATE INDEX idx_ml_historico_executed_at ON public.ml_devolucoes_historico_acoes(executed_at DESC);

COMMENT ON TABLE public.ml_devolucoes_historico_acoes IS 'Histórico de ações executadas nas devoluções do Mercado Livre';
COMMENT ON COLUMN public.ml_devolucoes_historico_acoes.action_type IS 'Tipo da ação: review_ok, review_fail, print_label, appeal, ship, refund';
COMMENT ON COLUMN public.ml_devolucoes_historico_acoes.action_data IS 'Dados enviados na ação (ex: razão e mensagem)';
COMMENT ON COLUMN public.ml_devolucoes_historico_acoes.api_response IS 'Resposta completa da API do ML';