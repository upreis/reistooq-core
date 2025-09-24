-- Criar tabelas do sistema OMS (corrigido)
-- 1. Tabela de clientes OMS
CREATE TABLE public.oms_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  doc TEXT, -- CPF/CNPJ
  email TEXT,
  phone TEXT,
  price_tier TEXT DEFAULT 'standard' CHECK (price_tier IN ('standard', 'premium', 'vip')),
  payment_terms TEXT DEFAULT '30_days',
  billing_address JSONB,
  shipping_address JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de representantes de vendas
CREATE TABLE public.oms_sales_reps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  default_commission_pct DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de pedidos OMS
CREATE TABLE public.oms_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.oms_customers(id),
  sales_rep_id UUID REFERENCES public.oms_sales_reps(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'invoiced', 'cancelled')),
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_date TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  payment_terms TEXT DEFAULT '30_days',
  payment_term_days INTEGER DEFAULT 30,
  payment_method TEXT,
  shipping_total DECIMAL(10,2) DEFAULT 0,
  shipping_method TEXT,
  delivery_address TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_type TEXT DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(10,2) DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de itens dos pedidos (sem referência ao estoque que não existe)
CREATE TABLE public.oms_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.oms_orders(id) ON DELETE CASCADE,
  product_id UUID, -- Referência opcional para integração futura
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  qty DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_pct DECIMAL(5,2) DEFAULT 0,
  discount_value DECIMAL(10,2) DEFAULT 0,
  tax_value DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_oms_orders_customer_id ON public.oms_orders(customer_id);
CREATE INDEX idx_oms_orders_sales_rep_id ON public.oms_orders(sales_rep_id);
CREATE INDEX idx_oms_orders_status ON public.oms_orders(status);
CREATE INDEX idx_oms_orders_number ON public.oms_orders(number);
CREATE INDEX idx_oms_order_items_order_id ON public.oms_order_items(order_id);
CREATE INDEX idx_oms_order_items_sku ON public.oms_order_items(sku);

-- Habilitar RLS nas tabelas
ALTER TABLE public.oms_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oms_sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oms_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oms_order_items ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para clientes
CREATE POLICY "Usuários podem ver todos os clientes" 
ON public.oms_customers 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem criar clientes" 
ON public.oms_customers 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar clientes" 
ON public.oms_customers 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Criar políticas RLS para representantes
CREATE POLICY "Usuários podem ver representantes" 
ON public.oms_sales_reps 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem criar representantes" 
ON public.oms_sales_reps 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar representantes" 
ON public.oms_sales_reps 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Criar políticas RLS para pedidos
CREATE POLICY "Usuários podem ver todos os pedidos" 
ON public.oms_orders 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem criar pedidos" 
ON public.oms_orders 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar pedidos" 
ON public.oms_orders 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem deletar pedidos" 
ON public.oms_orders 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Criar políticas RLS para itens dos pedidos
CREATE POLICY "Usuários podem ver itens dos pedidos" 
ON public.oms_order_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem criar itens dos pedidos" 
ON public.oms_order_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar itens dos pedidos" 
ON public.oms_order_items 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem deletar itens dos pedidos" 
ON public.oms_order_items 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Criar triggers para atualização automática de timestamps
CREATE TRIGGER update_oms_customers_updated_at
BEFORE UPDATE ON public.oms_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oms_sales_reps_updated_at
BEFORE UPDATE ON public.oms_sales_reps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oms_orders_updated_at
BEFORE UPDATE ON public.oms_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oms_order_items_updated_at
BEFORE UPDATE ON public.oms_order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO public.oms_customers (name, doc, email, phone, price_tier, payment_terms) VALUES
('Cliente Exemplo', '12.345.678/0001-90', 'cliente@exemplo.com', '(11) 99999-9999', 'standard', '30_days'),
('Cliente Premium', '11.222.333/0001-44', 'premium@exemplo.com', '(11) 88888-8888', 'premium', '15_days'),
('Cliente VIP', '55.666.777/0001-88', 'vip@exemplo.com', '(11) 77777-7777', 'vip', 'cash');

INSERT INTO public.oms_sales_reps (name, email, phone, default_commission_pct) VALUES
('João Silva', 'joao@empresa.com', '(11) 88888-8888', 5.0),
('Maria Santos', 'maria@empresa.com', '(11) 77777-7777', 4.5);