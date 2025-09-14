-- Criar tabela para armazenar TODAS as orders do ML
CREATE TABLE public.ml_orders_completas (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id TEXT NOT NULL,
  status TEXT,
  date_created TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL,
  currency TEXT,
  buyer_id TEXT,
  buyer_nickname TEXT,
  item_title TEXT,
  quantity INTEGER,
  has_claims BOOLEAN DEFAULT FALSE,
  claims_count INTEGER DEFAULT 0,
  raw_data JSONB,
  integration_account_id UUID REFERENCES public.integration_accounts(id),
  organization_id UUID REFERENCES public.organizacoes(id) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.ml_orders_completas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para a nova tabela
CREATE POLICY "ml_orders_completas_org_select" ON public.ml_orders_completas
  FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "ml_orders_completas_org_insert" ON public.ml_orders_completas
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "ml_orders_completas_org_update" ON public.ml_orders_completas
  FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "ml_orders_completas_org_delete" ON public.ml_orders_completas
  FOR DELETE USING (organization_id = get_current_org_id());

-- Índices para performance
CREATE INDEX idx_ml_orders_completas_order_id ON public.ml_orders_completas(order_id);
CREATE INDEX idx_ml_orders_completas_status ON public.ml_orders_completas(status);
CREATE INDEX idx_ml_orders_completas_date_created ON public.ml_orders_completas(date_created);
CREATE INDEX idx_ml_orders_completas_integration_account ON public.ml_orders_completas(integration_account_id);
CREATE INDEX idx_ml_orders_completas_organization ON public.ml_orders_completas(organization_id);

-- Constraint para evitar duplicatas por conta
CREATE UNIQUE INDEX idx_ml_orders_completas_unique_order_account 
ON public.ml_orders_completas(order_id, integration_account_id);