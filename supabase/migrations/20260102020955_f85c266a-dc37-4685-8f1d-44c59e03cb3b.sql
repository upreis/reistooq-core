-- =============================================
-- Migração: Campos adicionais para OMS Orders
-- =============================================

-- Adicionar campos faltantes na tabela oms_orders
ALTER TABLE public.oms_orders
ADD COLUMN IF NOT EXISTS id_unico TEXT,
ADD COLUMN IF NOT EXISTS empresa TEXT,
ADD COLUMN IF NOT EXISTS comissao_percentual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS comissao_valor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_logistico TEXT,
ADD COLUMN IF NOT EXISTS codigo_rastreamento TEXT,
ADD COLUMN IF NOT EXISTS local_estoque_id UUID REFERENCES public.locais_estoque(id),
ADD COLUMN IF NOT EXISTS custo_produto_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_liquido NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS endereco_rua TEXT,
ADD COLUMN IF NOT EXISTS endereco_numero TEXT,
ADD COLUMN IF NOT EXISTS endereco_bairro TEXT,
ADD COLUMN IF NOT EXISTS endereco_cep TEXT,
ADD COLUMN IF NOT EXISTS endereco_cidade TEXT,
ADD COLUMN IF NOT EXISTS endereco_uf TEXT;

-- Adicionar campos faltantes na tabela oms_customers para endereço completo
ALTER TABLE public.oms_customers
ADD COLUMN IF NOT EXISTS endereco_rua TEXT,
ADD COLUMN IF NOT EXISTS endereco_numero TEXT,
ADD COLUMN IF NOT EXISTS endereco_bairro TEXT,
ADD COLUMN IF NOT EXISTS endereco_cep TEXT,
ADD COLUMN IF NOT EXISTS endereco_cidade TEXT,
ADD COLUMN IF NOT EXISTS endereco_uf TEXT;

-- Adicionar campo de custo unitário nos itens do pedido
ALTER TABLE public.oms_order_items
ADD COLUMN IF NOT EXISTS custo_unitario NUMERIC DEFAULT 0;

-- Criar índice único para id_unico
CREATE UNIQUE INDEX IF NOT EXISTS idx_oms_orders_id_unico 
ON public.oms_orders(id_unico) 
WHERE id_unico IS NOT NULL;

-- Criar sequência para número do pedido OMS por ano
CREATE SEQUENCE IF NOT EXISTS oms_order_number_seq START WITH 4;

-- Função para gerar próximo número de pedido OMS no formato NNNNNN/YYYY
CREATE OR REPLACE FUNCTION generate_oms_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Buscar o maior número do ano atual
  SELECT COALESCE(MAX(
    NULLIF(SPLIT_PART(number, '/', 1), '')::INTEGER
  ), 0) + 1 INTO next_number
  FROM oms_orders 
  WHERE number LIKE '%/' || current_year;
  
  -- Se não encontrou, começar do 1
  IF next_number IS NULL OR next_number < 1 THEN
    next_number := 1;
  END IF;
  
  -- Formatar com 6 dígitos
  formatted_number := LPAD(next_number::TEXT, 6, '0') || '/' || current_year;
  
  RETURN formatted_number;
END;
$$;

-- Função para gerar id_unico baseado nos SKUs + número do pedido
CREATE OR REPLACE FUNCTION generate_oms_id_unico(order_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  skus_part TEXT;
  order_number TEXT;
  result_id TEXT;
BEGIN
  -- Buscar o número do pedido
  SELECT number INTO order_number FROM oms_orders WHERE id = order_id;
  
  -- Buscar e concatenar os SKUs dos itens
  SELECT STRING_AGG(UPPER(sku), '+' ORDER BY sku) 
  INTO skus_part
  FROM oms_order_items 
  WHERE oms_order_items.order_id = generate_oms_id_unico.order_id;
  
  -- Montar id_unico
  IF skus_part IS NULL OR skus_part = '' THEN
    skus_part := 'NO-SKU';
  END IF;
  
  result_id := skus_part || '-' || order_number;
  
  RETURN result_id;
END;
$$;

-- Atualizar RLS policies para oms_orders (garantir organization_id)
DO $$
BEGIN
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "oms_orders_org_policy" ON public.oms_orders;
  
  -- Create new policy
  CREATE POLICY "oms_orders_org_policy" ON public.oms_orders
    FOR ALL
    USING (organization_id = get_current_org_id())
    WITH CHECK (organization_id = get_current_org_id());
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Atualizar RLS policies para oms_customers
DO $$
BEGIN
  DROP POLICY IF EXISTS "oms_customers_org_policy" ON public.oms_customers;
  
  CREATE POLICY "oms_customers_org_policy" ON public.oms_customers
    FOR ALL
    USING (organization_id = get_current_org_id())
    WITH CHECK (organization_id = get_current_org_id());
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Atualizar RLS policies para oms_order_items (via join com oms_orders)
DO $$
BEGIN
  DROP POLICY IF EXISTS "oms_order_items_org_policy" ON public.oms_order_items;
  
  CREATE POLICY "oms_order_items_org_policy" ON public.oms_order_items
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM oms_orders 
        WHERE oms_orders.id = oms_order_items.order_id 
        AND oms_orders.organization_id = get_current_org_id()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM oms_orders 
        WHERE oms_orders.id = oms_order_items.order_id 
        AND oms_orders.organization_id = get_current_org_id()
      )
    );
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;