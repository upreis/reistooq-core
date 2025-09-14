-- Criar nova tabela para sistema de devoluções avançado
CREATE TABLE public.devolucoes_avancadas (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- IDENTIFICADORES
  order_id TEXT NOT NULL,
  claim_id TEXT,
  return_id TEXT,
  
  -- DATAS E CRONOGRAMA
  data_criacao TIMESTAMP WITH TIME ZONE,
  data_fechamento TIMESTAMP WITH TIME ZONE,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE,
  
  -- STATUS
  status_devolucao TEXT,
  status_envio TEXT,
  status_dinheiro TEXT,
  
  -- CRONOGRAMA FINANCEIRO
  reembolso_quando TEXT, -- 'shipped', 'delivered', 'n/a'
  valor_retido DECIMAL(10,2),
  
  -- LOGÍSTICA
  codigo_rastreamento TEXT,
  destino_tipo TEXT, -- 'warehouse', 'seller_address'
  destino_endereco JSONB,
  
  -- DADOS BRUTOS
  dados_order JSONB,
  dados_claim JSONB,
  dados_return JSONB,
  
  -- CONTROLE
  integration_account_id UUID REFERENCES public.integration_accounts(id),
  organization_id UUID NOT NULL DEFAULT public.get_current_org_id(),
  processado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.devolucoes_avancadas ENABLE ROW LEVEL SECURITY;

-- Create policies for organization-based access
CREATE POLICY "devolucoes_avancadas_org_select" 
ON public.devolucoes_avancadas 
FOR SELECT 
USING (organization_id = public.get_current_org_id());

CREATE POLICY "devolucoes_avancadas_org_insert" 
ON public.devolucoes_avancadas 
FOR INSERT 
WITH CHECK (organization_id = public.get_current_org_id());

CREATE POLICY "devolucoes_avancadas_org_update" 
ON public.devolucoes_avancadas 
FOR UPDATE 
USING (organization_id = public.get_current_org_id());

CREATE POLICY "devolucoes_avancadas_org_delete" 
ON public.devolucoes_avancadas 
FOR DELETE 
USING (organization_id = public.get_current_org_id());

-- Create index for better performance
CREATE INDEX idx_devolucoes_avancadas_org_id ON public.devolucoes_avancadas(organization_id);
CREATE INDEX idx_devolucoes_avancadas_order_id ON public.devolucoes_avancadas(order_id);
CREATE INDEX idx_devolucoes_avancadas_account_id ON public.devolucoes_avancadas(integration_account_id);