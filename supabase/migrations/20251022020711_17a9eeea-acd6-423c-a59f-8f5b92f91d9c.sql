-- =====================================================
-- SISTEMA DE FILAS PARA PROCESSAMENTO DE CLAIMS
-- =====================================================

-- Criar tabela de fila de processamento
CREATE TABLE IF NOT EXISTS public.fila_processamento_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_account_id TEXT NOT NULL,
  claim_id TEXT NOT NULL,
  order_id TEXT,
  claim_data JSONB NOT NULL,
  
  -- Status de processamento
  status TEXT NOT NULL DEFAULT 'pending',
  tentativas INTEGER DEFAULT 0,
  max_tentativas INTEGER DEFAULT 3,
  
  -- Metadados
  erro_mensagem TEXT,
  processado_em TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  UNIQUE(claim_id, integration_account_id)
);

-- Criar índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_fila_status ON public.fila_processamento_claims(status);
CREATE INDEX IF NOT EXISTS idx_fila_integration ON public.fila_processamento_claims(integration_account_id);
CREATE INDEX IF NOT EXISTS idx_fila_criado_em ON public.fila_processamento_claims(criado_em);

-- Habilitar RLS
ALTER TABLE public.fila_processamento_claims ENABLE ROW LEVEL SECURITY;

-- Política: Service role tem acesso total
CREATE POLICY "Service role tem acesso total à fila"
  ON public.fila_processamento_claims
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_fila_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fila_updated_at
  BEFORE UPDATE ON public.fila_processamento_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_fila_updated_at();