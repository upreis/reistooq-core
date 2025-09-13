-- Criar tabela para armazenar devoluções/reclamações do Mercado Livre
CREATE TABLE public.ml_devolucoes_reclamacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_account_id UUID NOT NULL,
  organization_id UUID NOT NULL DEFAULT get_current_org_id(),
  
  -- Identificadores do ML
  claim_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  order_number TEXT,
  
  -- Dados do cliente
  buyer_id TEXT,
  buyer_nickname TEXT,
  buyer_email TEXT,
  
  -- Dados do produto
  item_id TEXT,
  item_title TEXT,
  sku TEXT,
  variation_id TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  
  -- Status e tipo
  claim_type TEXT NOT NULL, -- 'claim', 'return', 'cancellation'
  claim_status TEXT NOT NULL, -- 'pending', 'in_process', 'resolved', 'closed'
  claim_stage TEXT, -- 'claim_opened', 'mediation', 'resolution'
  resolution TEXT, -- 'refund', 'replacement', 'partial_refund', 'no_action'
  
  -- Motivos
  reason_code TEXT,
  reason_description TEXT,
  
  -- Valores financeiros
  amount_claimed DECIMAL(10,2),
  amount_refunded DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  
  -- Datas importantes
  date_created TIMESTAMP WITH TIME ZONE NOT NULL,
  date_closed TIMESTAMP WITH TIME ZONE,
  date_last_update TIMESTAMP WITH TIME ZONE,
  
  -- Mensagens e comunicação
  last_message TEXT,
  seller_response TEXT,
  
  -- Status de processamento interno
  processed_status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  internal_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  raw_data JSONB DEFAULT '{}',
  tags TEXT[],
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(claim_id, integration_account_id)
);

-- Habilitar RLS
ALTER TABLE public.ml_devolucoes_reclamacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "ml_devolucoes_select_org" 
ON public.ml_devolucoes_reclamacoes 
FOR SELECT 
USING (organization_id = get_current_org_id());

CREATE POLICY "ml_devolucoes_insert_org" 
ON public.ml_devolucoes_reclamacoes 
FOR INSERT 
WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "ml_devolucoes_update_org" 
ON public.ml_devolucoes_reclamacoes 
FOR UPDATE 
USING (organization_id = get_current_org_id());

CREATE POLICY "ml_devolucoes_delete_org" 
ON public.ml_devolucoes_reclamacoes 
FOR DELETE 
USING (organization_id = get_current_org_id());

-- Índices para performance
CREATE INDEX idx_ml_devolucoes_account_id ON public.ml_devolucoes_reclamacoes(integration_account_id);
CREATE INDEX idx_ml_devolucoes_claim_id ON public.ml_devolucoes_reclamacoes(claim_id);
CREATE INDEX idx_ml_devolucoes_order_id ON public.ml_devolucoes_reclamacoes(order_id);
CREATE INDEX idx_ml_devolucoes_status ON public.ml_devolucoes_reclamacoes(claim_status);
CREATE INDEX idx_ml_devolucoes_processed ON public.ml_devolucoes_reclamacoes(processed_status);
CREATE INDEX idx_ml_devolucoes_dates ON public.ml_devolucoes_reclamacoes(date_created, date_closed);
CREATE INDEX idx_ml_devolucoes_org_id ON public.ml_devolucoes_reclamacoes(organization_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ml_devolucoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ml_devolucoes_updated_at
  BEFORE UPDATE ON public.ml_devolucoes_reclamacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_ml_devolucoes_updated_at();