-- Create advanced returns table
CREATE TABLE devolucoes_avancadas (
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
  valor_retido DECIMAL,
  
  -- LOGÍSTICA
  codigo_rastreamento TEXT,
  destino_tipo TEXT, -- 'warehouse', 'seller_address'
  destino_endereco JSONB,
  
  -- DADOS BRUTOS
  dados_order JSONB,
  dados_claim JSONB,
  dados_return JSONB,
  
  -- CONTROLE
  integration_account_id UUID,
  organization_id UUID NOT NULL DEFAULT get_current_org_id(),
  processado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE devolucoes_avancadas ENABLE ROW LEVEL SECURITY;

-- Create policies for organization isolation
CREATE POLICY "devolucoes_avancadas_org_select" 
ON devolucoes_avancadas 
FOR SELECT 
USING (organization_id = get_current_org_id());

CREATE POLICY "devolucoes_avancadas_org_insert" 
ON devolucoes_avancadas 
FOR INSERT 
WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "devolucoes_avancadas_org_update" 
ON devolucoes_avancadas 
FOR UPDATE 
USING (organization_id = get_current_org_id());

CREATE POLICY "devolucoes_avancadas_org_delete" 
ON devolucoes_avancadas 
FOR DELETE 
USING (organization_id = get_current_org_id());