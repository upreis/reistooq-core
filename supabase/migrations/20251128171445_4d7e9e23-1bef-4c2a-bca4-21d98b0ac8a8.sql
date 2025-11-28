-- ✅ CORREÇÃO PROBLEMAS 1, 2, 5: Criar tabela ml_orders_cache com organization_id e índices otimizados
CREATE TABLE IF NOT EXISTS public.ml_orders_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  integration_account_id UUID NOT NULL,
  order_id TEXT NOT NULL,
  order_data JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ttl_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint única para evitar duplicatas
  CONSTRAINT unique_order_per_account UNIQUE (organization_id, integration_account_id, order_id)
);

-- Índice composto para queries rápidas de cache lookup
CREATE INDEX IF NOT EXISTS idx_ml_orders_cache_lookup 
ON public.ml_orders_cache(organization_id, integration_account_id, ttl_expires_at);

-- Índice para TTL cleanup (sem WHERE clause para evitar erro IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_ml_orders_cache_ttl 
ON public.ml_orders_cache(ttl_expires_at);

-- Índice JSONB GIN para queries dentro do order_data
CREATE INDEX IF NOT EXISTS idx_ml_orders_cache_order_data 
ON public.ml_orders_cache USING GIN(order_data);

-- Enable RLS
ALTER TABLE public.ml_orders_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read cache from their organization
CREATE POLICY "Users can read cache from their organization"
ON public.ml_orders_cache
FOR SELECT
USING (organization_id = get_current_org_id());

-- RLS Policy: System can insert cache (via Edge Function with service role)
CREATE POLICY "System can insert cache"
ON public.ml_orders_cache
FOR INSERT
WITH CHECK (organization_id = get_current_org_id());

-- RLS Policy: System can update cache (via Edge Function with service role)
CREATE POLICY "System can update cache"
ON public.ml_orders_cache
FOR UPDATE
USING (organization_id = get_current_org_id());

-- RLS Policy: System can delete expired cache
CREATE POLICY "System can delete expired cache"
ON public.ml_orders_cache
FOR DELETE
USING (organization_id = get_current_org_id());

COMMENT ON TABLE public.ml_orders_cache IS 'Cache unificado de pedidos do Mercado Livre para otimização de performance';
COMMENT ON COLUMN public.ml_orders_cache.organization_id IS 'Isolamento multi-tenant - cada org vê apenas seu cache';
COMMENT ON COLUMN public.ml_orders_cache.order_data IS 'JSON completo do pedido enriquecido com todos os dados da ML API';
COMMENT ON COLUMN public.ml_orders_cache.ttl_expires_at IS 'Data/hora de expiração do cache (TTL padrão 15 minutos)';