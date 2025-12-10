-- ============================================
-- 🔴 TABELA: vendas_hoje_realtime
-- Tabela para painel de vendas ao vivo
-- Com Supabase Realtime habilitado
-- ============================================

CREATE TABLE IF NOT EXISTS public.vendas_hoje_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  integration_account_id UUID NOT NULL REFERENCES public.integration_accounts(id),
  account_name TEXT,
  
  -- Dados do pedido
  order_id TEXT NOT NULL,
  order_status TEXT,
  date_created TIMESTAMPTZ,
  date_closed TIMESTAMPTZ,
  
  -- Valores financeiros
  total_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  currency_id TEXT DEFAULT 'BRL',
  
  -- Dados do comprador
  buyer_id TEXT,
  buyer_nickname TEXT,
  
  -- Dados do produto (primeiro item do pedido)
  item_id TEXT,
  item_title TEXT,
  item_thumbnail TEXT,
  item_quantity INTEGER DEFAULT 1,
  item_unit_price NUMERIC(12,2) DEFAULT 0,
  item_sku TEXT,
  
  -- Metadados
  order_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint para evitar duplicatas
  CONSTRAINT vendas_hoje_realtime_unique UNIQUE (organization_id, order_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vendas_hoje_org ON public.vendas_hoje_realtime(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendas_hoje_account ON public.vendas_hoje_realtime(integration_account_id);
CREATE INDEX IF NOT EXISTS idx_vendas_hoje_date ON public.vendas_hoje_realtime(date_created DESC);
CREATE INDEX IF NOT EXISTS idx_vendas_hoje_status ON public.vendas_hoje_realtime(order_status);
CREATE INDEX IF NOT EXISTS idx_vendas_hoje_item ON public.vendas_hoje_realtime(item_id);

-- Enable RLS
ALTER TABLE public.vendas_hoje_realtime ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "vendas_hoje_realtime_select_org"
ON public.vendas_hoje_realtime
FOR SELECT
USING (organization_id = get_current_org_id());

CREATE POLICY "vendas_hoje_realtime_insert_org"
ON public.vendas_hoje_realtime
FOR INSERT
WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "vendas_hoje_realtime_update_org"
ON public.vendas_hoje_realtime
FOR UPDATE
USING (organization_id = get_current_org_id());

CREATE POLICY "vendas_hoje_realtime_delete_org"
ON public.vendas_hoje_realtime
FOR DELETE
USING (organization_id = get_current_org_id());

-- 🔴 HABILITAR REALTIME PARA NOTIFICAÇÕES INSTANTÂNEAS
ALTER TABLE public.vendas_hoje_realtime REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vendas_hoje_realtime;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Publication already contains table or does not exist';
END $$;

-- Comentários
COMMENT ON TABLE public.vendas_hoje_realtime IS 'Vendas do dia em tempo real para dashboard ao vivo';
COMMENT ON COLUMN public.vendas_hoje_realtime.item_thumbnail IS 'URL da imagem do produto principal do pedido';
COMMENT ON COLUMN public.vendas_hoje_realtime.order_data IS 'JSON completo do pedido para dados adicionais';