-- Adicionar colunas faltantes na tabela ml_vendas_comenvio
ALTER TABLE public.ml_vendas_comenvio 
  ADD COLUMN IF NOT EXISTS account_name text,
  ADD COLUMN IF NOT EXISTS order_status text,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS shipping_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS buyer_name text,
  ADD COLUMN IF NOT EXISTS shipment_id text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS carrier text,
  ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS items_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS items_quantity integer DEFAULT 0;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ml_vendas_comenvio_account_date 
  ON public.ml_vendas_comenvio(integration_account_id, date_created DESC);

CREATE INDEX IF NOT EXISTS idx_ml_vendas_comenvio_shipping_status 
  ON public.ml_vendas_comenvio(shipping_status);

CREATE INDEX IF NOT EXISTS idx_ml_vendas_comenvio_org 
  ON public.ml_vendas_comenvio(organization_id);

-- Adicionar constraint UNIQUE para upsert funcionar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ml_vendas_comenvio_order_account_unique'
  ) THEN
    ALTER TABLE public.ml_vendas_comenvio 
    ADD CONSTRAINT ml_vendas_comenvio_order_account_unique 
    UNIQUE (order_id, integration_account_id);
  END IF;
END $$;

-- Comentário
COMMENT ON TABLE public.ml_vendas_comenvio IS 'Cache de vendas do ML com envio pendente (ready_to_ship, pending, handling). Sincronizado via CRON job.';