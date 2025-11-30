-- ============================================
-- 🔄 COMBO 2 PARA DEVOLUÇÕES - FASE A
-- Infraestrutura de cache para ml_claims
-- ============================================

-- ==========================================
-- TABELA 1: ml_claims (Cache permanente)
-- ==========================================
CREATE TABLE IF NOT EXISTS ml_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  integration_account_id UUID NOT NULL,
  
  -- IDs do Mercado Livre
  claim_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  return_id TEXT,
  
  -- Dados principais
  status TEXT,
  stage TEXT,
  reason_id TEXT,
  date_created TIMESTAMP WITH TIME ZONE,
  date_closed TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE,
  
  -- Dados financeiros
  total_amount NUMERIC(10,2),
  refund_amount NUMERIC(10,2),
  currency_id TEXT DEFAULT 'BRL',
  
  -- Dados do comprador
  buyer_id BIGINT,
  buyer_nickname TEXT,
  
  -- JSON completo da claim (enriquecido)
  claim_data JSONB NOT NULL,
  
  -- Controle de sincronização
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, integration_account_id, claim_id)
);

-- Índices otimizados para ml_claims
CREATE INDEX IF NOT EXISTS idx_ml_claims_org_account 
  ON ml_claims(organization_id, integration_account_id);

CREATE INDEX IF NOT EXISTS idx_ml_claims_claim_id 
  ON ml_claims(claim_id);

CREATE INDEX IF NOT EXISTS idx_ml_claims_order_id 
  ON ml_claims(order_id);

CREATE INDEX IF NOT EXISTS idx_ml_claims_date_created 
  ON ml_claims(organization_id, date_created DESC);

CREATE INDEX IF NOT EXISTS idx_ml_claims_last_synced 
  ON ml_claims(organization_id, last_synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_ml_claims_status 
  ON ml_claims(organization_id, status);

-- RLS Policies para ml_claims
ALTER TABLE ml_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ml_claims_select_own_org"
  ON ml_claims FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "ml_claims_insert_validated"
  ON ml_claims FOR INSERT
  WITH CHECK (
    organization_id = get_current_org_id() 
    OR auth.uid() IS NULL  -- Service role
  );

CREATE POLICY "ml_claims_update_own_org"
  ON ml_claims FOR UPDATE
  USING (organization_id = get_current_org_id())
  WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "ml_claims_delete_own_org"
  ON ml_claims FOR DELETE
  USING (organization_id = get_current_org_id());

-- ==========================================
-- TABELA 2: ml_claims_cache (TTL cache)
-- ==========================================
CREATE TABLE IF NOT EXISTS ml_claims_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  integration_account_id UUID NOT NULL,
  claim_id TEXT NOT NULL,
  
  -- Dados completos (JSON enriquecido)
  claim_data JSONB NOT NULL,
  
  -- Controle de TTL
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ttl_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Constraint
  UNIQUE(organization_id, integration_account_id, claim_id)
);

-- Índices otimizados para ml_claims_cache
CREATE INDEX IF NOT EXISTS idx_ml_claims_cache_org_account 
  ON ml_claims_cache(organization_id, integration_account_id);

CREATE INDEX IF NOT EXISTS idx_ml_claims_cache_ttl 
  ON ml_claims_cache(organization_id, ttl_expires_at DESC);

-- RLS Policies para ml_claims_cache
ALTER TABLE ml_claims_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ml_claims_cache_select_own_org"
  ON ml_claims_cache FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "ml_claims_cache_insert_validated"
  ON ml_claims_cache FOR INSERT
  WITH CHECK (
    organization_id = get_current_org_id() 
    OR auth.uid() IS NULL
  );

CREATE POLICY "ml_claims_cache_update_own_org"
  ON ml_claims_cache FOR UPDATE
  USING (organization_id = get_current_org_id());

CREATE POLICY "ml_claims_cache_delete_own_org"
  ON ml_claims_cache FOR DELETE
  USING (organization_id = get_current_org_id());

-- ==========================================
-- TABELA 3: ml_claims_sync_status
-- ==========================================
CREATE TABLE IF NOT EXISTS ml_claims_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  integration_account_id UUID NOT NULL,
  
  -- Status da última sincronização
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'running')),
  last_sync_error TEXT,
  
  -- Estatísticas
  claims_fetched INTEGER DEFAULT 0,
  claims_cached INTEGER DEFAULT 0,
  sync_duration_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint
  UNIQUE(organization_id, integration_account_id)
);

-- Índice para ml_claims_sync_status
CREATE INDEX IF NOT EXISTS idx_ml_claims_sync_org_account 
  ON ml_claims_sync_status(organization_id, integration_account_id);

-- RLS Policies para ml_claims_sync_status
ALTER TABLE ml_claims_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ml_claims_sync_select_own_org"
  ON ml_claims_sync_status FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "ml_claims_sync_insert_validated"
  ON ml_claims_sync_status FOR INSERT
  WITH CHECK (
    organization_id = get_current_org_id() 
    OR auth.uid() IS NULL
  );

CREATE POLICY "ml_claims_sync_update_own_org"
  ON ml_claims_sync_status FOR UPDATE
  USING (organization_id = get_current_org_id());

-- ==========================================
-- COMENTÁRIOS DAS TABELAS
-- ==========================================
COMMENT ON TABLE ml_claims IS 
  'Cache permanente de claims/devoluções do Mercado Livre';

COMMENT ON TABLE ml_claims_cache IS 
  'Cache temporário (TTL 15min) de claims enriquecidas';

COMMENT ON TABLE ml_claims_sync_status IS 
  'Status de sincronização automática com API ML (claims)';