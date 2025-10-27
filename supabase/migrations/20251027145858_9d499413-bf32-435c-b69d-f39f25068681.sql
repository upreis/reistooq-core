-- 📋 TABELA PRINCIPAL DE RECLAMAÇÕES (CLAIMS)
CREATE TABLE IF NOT EXISTS public.reclamacoes (
  -- Identificadores principais
  claim_id TEXT PRIMARY KEY,
  type TEXT,
  status TEXT,
  stage TEXT,
  resource_id TEXT,
  resource TEXT,
  reason_id TEXT,
  date_created TIMESTAMPTZ,
  last_updated TIMESTAMPTZ,
  site_id TEXT,
  
  -- Reason (Motivo)
  reason_name TEXT,
  reason_detail TEXT,
  reason_category TEXT,
  
  -- Players (Participantes)
  buyer_id BIGINT,
  buyer_nickname TEXT,
  seller_id BIGINT,
  seller_nickname TEXT,
  mediator_id BIGINT,
  
  -- Valores
  amount_value DECIMAL(10,2),
  amount_currency TEXT,
  
  -- Resolution (Resolução)
  resolution_type TEXT,
  resolution_subtype TEXT,
  resolution_benefited TEXT,
  resolution_date TIMESTAMPTZ,
  resolution_amount DECIMAL(10,2),
  resolution_reason TEXT,
  
  -- Related Entities (flags)
  tem_mensagens BOOLEAN DEFAULT false,
  tem_evidencias BOOLEAN DEFAULT false,
  tem_trocas BOOLEAN DEFAULT false,
  tem_mediacao BOOLEAN DEFAULT false,
  
  -- Contadores
  total_mensagens INTEGER DEFAULT 0,
  total_evidencias INTEGER DEFAULT 0,
  mensagens_nao_lidas INTEGER DEFAULT 0,
  
  -- Order (Pedido relacionado)
  order_id TEXT,
  order_status TEXT,
  order_total DECIMAL(10,2),
  
  -- Metadata
  integration_account_id UUID REFERENCES public.integration_accounts(id),
  organization_id UUID REFERENCES public.organizacoes(id),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reclamacoes_account ON public.reclamacoes(integration_account_id);
CREATE INDEX IF NOT EXISTS idx_reclamacoes_org ON public.reclamacoes(organization_id);
CREATE INDEX IF NOT EXISTS idx_reclamacoes_status ON public.reclamacoes(status);
CREATE INDEX IF NOT EXISTS idx_reclamacoes_date ON public.reclamacoes(date_created);
CREATE INDEX IF NOT EXISTS idx_reclamacoes_seller ON public.reclamacoes(seller_id);

-- 📨 TABELA DE MENSAGENS
CREATE TABLE IF NOT EXISTS public.reclamacoes_mensagens (
  id TEXT PRIMARY KEY,
  claim_id TEXT REFERENCES public.reclamacoes(claim_id) ON DELETE CASCADE,
  text TEXT,
  sender_id BIGINT,
  sender_role TEXT,
  receiver_id BIGINT,
  receiver_role TEXT,
  date_created TIMESTAMPTZ,
  date_read TIMESTAMPTZ,
  status TEXT,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reclamacoes_mensagens_claim ON public.reclamacoes_mensagens(claim_id);
CREATE INDEX IF NOT EXISTS idx_reclamacoes_mensagens_date ON public.reclamacoes_mensagens(date_created);

-- 📎 TABELA DE EVIDÊNCIAS
CREATE TABLE IF NOT EXISTS public.reclamacoes_evidencias (
  id TEXT PRIMARY KEY,
  claim_id TEXT REFERENCES public.reclamacoes(claim_id) ON DELETE CASCADE,
  type TEXT,
  url TEXT,
  uploader_id BIGINT,
  uploader_role TEXT,
  date_created TIMESTAMPTZ,
  status TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reclamacoes_evidencias_claim ON public.reclamacoes_evidencias(claim_id);

-- 🔄 TABELA DE TROCAS
CREATE TABLE IF NOT EXISTS public.reclamacoes_trocas (
  claim_id TEXT PRIMARY KEY REFERENCES public.reclamacoes(claim_id) ON DELETE CASCADE,
  resource TEXT,
  resource_id TEXT,
  items JSONB,
  return_id BIGINT,
  new_orders_ids JSONB,
  new_orders_shipments JSONB,
  status TEXT,
  status_detail TEXT,
  type TEXT,
  estimated_exchange_date_from TIMESTAMPTZ,
  estimated_exchange_date_to TIMESTAMPTZ,
  date_created TIMESTAMPTZ,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.reclamacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reclamacoes_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reclamacoes_evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reclamacoes_trocas ENABLE ROW LEVEL SECURITY;

-- Policy para reclamacoes
CREATE POLICY "Users can view reclamacoes from their organization"
  ON public.reclamacoes FOR SELECT
  USING (
    organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reclamacoes to their organization"
  ON public.reclamacoes FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update reclamacoes from their organization"
  ON public.reclamacoes FOR UPDATE
  USING (
    organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy para mensagens
CREATE POLICY "Users can view mensagens from their organization"
  ON public.reclamacoes_mensagens FOR SELECT
  USING (
    claim_id IN (
      SELECT claim_id FROM public.reclamacoes 
      WHERE organization_id IN (
        SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert mensagens to their organization"
  ON public.reclamacoes_mensagens FOR INSERT
  WITH CHECK (
    claim_id IN (
      SELECT claim_id FROM public.reclamacoes 
      WHERE organization_id IN (
        SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Policy para evidencias
CREATE POLICY "Users can view evidencias from their organization"
  ON public.reclamacoes_evidencias FOR SELECT
  USING (
    claim_id IN (
      SELECT claim_id FROM public.reclamacoes 
      WHERE organization_id IN (
        SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert evidencias to their organization"
  ON public.reclamacoes_evidencias FOR INSERT
  WITH CHECK (
    claim_id IN (
      SELECT claim_id FROM public.reclamacoes 
      WHERE organization_id IN (
        SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Policy para trocas
CREATE POLICY "Users can view trocas from their organization"
  ON public.reclamacoes_trocas FOR SELECT
  USING (
    claim_id IN (
      SELECT claim_id FROM public.reclamacoes 
      WHERE organization_id IN (
        SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert trocas to their organization"
  ON public.reclamacoes_trocas FOR INSERT
  WITH CHECK (
    claim_id IN (
      SELECT claim_id FROM public.reclamacoes 
      WHERE organization_id IN (
        SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );