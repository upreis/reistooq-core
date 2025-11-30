-- =====================================================
-- FASE A.2: TABELA ML_ORDERS - PERSISTÊNCIA PERMANENTE
-- Fonte de verdade central para pedidos do Mercado Livre
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ml_orders (
  -- Identificadores
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ml_order_id text NOT NULL,
  organization_id uuid NOT NULL,
  integration_account_id uuid NOT NULL,
  
  -- Campos principais extraídos para queries rápidas
  status text,
  date_created timestamptz,
  date_closed timestamptz,
  last_updated timestamptz,
  total_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  currency_id text DEFAULT 'BRL',
  
  -- Informações do comprador (para relatórios)
  buyer_id bigint,
  buyer_nickname text,
  buyer_email text,
  
  -- Flags úteis
  fulfilled boolean DEFAULT false,
  pack_id bigint,
  
  -- Dados completos do pedido (flexibilidade futura)
  order_data jsonb NOT NULL,
  
  -- Campos técnicos de controle
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_synced_at timestamptz DEFAULT now(),
  
  -- Constraint única: um pedido ML por organização/conta
  UNIQUE(organization_id, integration_account_id, ml_order_id)
);

-- =====================================================
-- INDEXES OTIMIZADOS PARA QUERIES COMUNS
-- =====================================================

-- Index principal: busca por organização + contas + período
CREATE INDEX idx_ml_orders_org_account_date 
ON public.ml_orders(organization_id, integration_account_id, date_created DESC);

-- Index para busca por status
CREATE INDEX idx_ml_orders_status 
ON public.ml_orders(organization_id, status);

-- Index para busca por ml_order_id (lookup direto)
CREATE INDEX idx_ml_orders_ml_id 
ON public.ml_orders(ml_order_id);

-- Index para última sincronização (útil para sync incremental)
CREATE INDEX idx_ml_orders_last_synced 
ON public.ml_orders(organization_id, last_synced_at DESC);

-- Index GIN para busca no JSONB (queries avançadas futuras)
CREATE INDEX idx_ml_orders_data_gin 
ON public.ml_orders USING gin(order_data);

-- =====================================================
-- TRIGGER: ATUALIZAR updated_at AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION update_ml_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ml_orders_updated_at
BEFORE UPDATE ON public.ml_orders
FOR EACH ROW
EXECUTE FUNCTION update_ml_orders_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.ml_orders ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - usuários podem ver pedidos da própria org
CREATE POLICY ml_orders_select_org 
ON public.ml_orders 
FOR SELECT 
USING (organization_id = get_current_org_id());

-- Policy: INSERT - sistema pode inserir (via service_role)
CREATE POLICY ml_orders_insert_system 
ON public.ml_orders 
FOR INSERT 
WITH CHECK (true);

-- Policy: UPDATE - sistema pode atualizar (via service_role)
CREATE POLICY ml_orders_update_system 
ON public.ml_orders 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Policy: DELETE - apenas admins podem deletar
CREATE POLICY ml_orders_delete_admin 
ON public.ml_orders 
FOR DELETE 
USING (organization_id = get_current_org_id() AND has_permission('system:admin'));

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.ml_orders IS 
'Tabela permanente de pedidos do Mercado Livre. 
Fonte de verdade central para todas as telas de pedidos.
Sincronizada via ml-orders-auto-sync + unified-ml-orders.';

COMMENT ON COLUMN public.ml_orders.ml_order_id IS 
'ID do pedido no Mercado Livre (ex: 2000014072974232)';

COMMENT ON COLUMN public.ml_orders.order_data IS 
'Dados completos do pedido em JSONB para flexibilidade futura';

COMMENT ON COLUMN public.ml_orders.last_synced_at IS 
'Última vez que este pedido foi sincronizado com ML API';
