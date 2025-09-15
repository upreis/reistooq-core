-- Criação das tabelas OMS
CREATE TABLE IF NOT EXISTS oms_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    doc TEXT,
    email TEXT,
    phone TEXT,
    billing_address JSONB,
    shipping_address JSONB,
    price_tier TEXT DEFAULT 'standard' CHECK (price_tier IN ('standard', 'premium', 'vip')),
    payment_terms TEXT DEFAULT '30_days',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oms_sales_reps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    default_commission_pct DECIMAL(5,2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oms_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    number TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES oms_customers(id),
    sales_rep_id UUID REFERENCES oms_sales_reps(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'invoiced', 'cancelled')),
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_total DECIMAL(12,2) DEFAULT 0,
    tax_total DECIMAL(12,2) DEFAULT 0,
    shipping_total DECIMAL(12,2) DEFAULT 0,
    grand_total DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_by UUID,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, number)
);

CREATE TABLE IF NOT EXISTS oms_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES oms_orders(id) ON DELETE CASCADE,
    product_id UUID,
    sku TEXT NOT NULL,
    title TEXT NOT NULL,
    qty DECIMAL(10,3) NOT NULL CHECK (qty > 0),
    unit_price DECIMAL(12,2) NOT NULL,
    discount_pct DECIMAL(5,2) DEFAULT 0,
    discount_value DECIMAL(12,2) DEFAULT 0,
    tax_code TEXT,
    tax_value DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oms_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES oms_orders(id),
    sales_rep_id UUID NOT NULL REFERENCES oms_sales_reps(id),
    base_amount DECIMAL(12,2) NOT NULL,
    commission_pct DECIMAL(5,2) NOT NULL,
    commission_value DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accrued', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de produtos para autocomplete
CREATE TABLE IF NOT EXISTS oms_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    sku TEXT NOT NULL,
    title TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, sku)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_oms_customers_org ON oms_customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_oms_sales_reps_org ON oms_sales_reps(organization_id);
CREATE INDEX IF NOT EXISTS idx_oms_orders_org ON oms_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_oms_orders_customer ON oms_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_oms_orders_sales_rep ON oms_orders(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_oms_order_items_order ON oms_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_oms_commissions_order ON oms_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_oms_products_org ON oms_products(organization_id);

-- RLS Policies
ALTER TABLE oms_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE oms_sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE oms_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE oms_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE oms_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oms_products ENABLE ROW LEVEL SECURITY;

-- Policies para organization_id
CREATE POLICY "org_policy_customers" ON oms_customers FOR ALL USING (organization_id = get_current_org_id());
CREATE POLICY "org_policy_sales_reps" ON oms_sales_reps FOR ALL USING (organization_id = get_current_org_id());
CREATE POLICY "org_policy_orders" ON oms_orders FOR ALL USING (organization_id = get_current_org_id());
CREATE POLICY "org_policy_products" ON oms_products FOR ALL USING (organization_id = get_current_org_id());
CREATE POLICY "org_policy_order_items" ON oms_order_items FOR ALL USING (EXISTS (SELECT 1 FROM oms_orders o WHERE o.id = order_id AND o.organization_id = get_current_org_id()));
CREATE POLICY "org_policy_commissions" ON oms_commissions FOR ALL USING (EXISTS (SELECT 1 FROM oms_orders o WHERE o.id = order_id AND o.organization_id = get_current_org_id()));

-- Função para gerar número de pedido
CREATE OR REPLACE FUNCTION generate_order_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    year_suffix TEXT;
BEGIN
    year_suffix := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM '^(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM oms_orders 
    WHERE organization_id = org_id 
    AND number ~ '^[0-9]+/' || year_suffix || '$';
    
    RETURN LPAD(next_number::TEXT, 6, '0') || '/' || year_suffix;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-gerar número do pedido
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.number IS NULL OR NEW.number = '' THEN
        NEW.number := generate_order_number(NEW.organization_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON oms_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Inserir dados de exemplo
INSERT INTO oms_products (organization_id, sku, title, price) VALUES
(get_current_org_id(), 'PROD-001', 'Produto Exemplo 1', 29.90),
(get_current_org_id(), 'PROD-002', 'Produto Exemplo 2', 49.90),
(get_current_org_id(), 'PROD-003', 'Produto Exemplo 3', 99.90)
ON CONFLICT DO NOTHING;