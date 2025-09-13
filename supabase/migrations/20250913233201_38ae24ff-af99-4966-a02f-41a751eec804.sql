-- Criar tabela temporária para capturar todos os dados da API ML
CREATE TABLE public.ml_api_raw_data (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_type TEXT NOT NULL, -- 'order' ou 'claim'
  order_id TEXT,
  claim_id TEXT,
  raw_json JSONB NOT NULL, -- TODOS os dados da API aqui
  integration_account_id UUID REFERENCES public.integration_accounts(id),
  organization_id UUID REFERENCES public.organizacoes(id)
);

-- Habilitar RLS
ALTER TABLE public.ml_api_raw_data ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "ml_api_raw_data_org_select" ON public.ml_api_raw_data
  FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "ml_api_raw_data_org_insert" ON public.ml_api_raw_data
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "ml_api_raw_data_org_update" ON public.ml_api_raw_data
  FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "ml_api_raw_data_org_delete" ON public.ml_api_raw_data
  FOR DELETE USING (organization_id = get_current_org_id());

-- Índices para performance
CREATE INDEX idx_ml_api_raw_data_type ON public.ml_api_raw_data(data_type);
CREATE INDEX idx_ml_api_raw_data_order_id ON public.ml_api_raw_data(order_id);
CREATE INDEX idx_ml_api_raw_data_claim_id ON public.ml_api_raw_data(claim_id);
CREATE INDEX idx_ml_api_raw_data_integration_account ON public.ml_api_raw_data(integration_account_id);
CREATE INDEX idx_ml_api_raw_data_organization ON public.ml_api_raw_data(organization_id);