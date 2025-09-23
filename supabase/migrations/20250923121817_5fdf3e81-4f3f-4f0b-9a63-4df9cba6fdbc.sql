-- Sistema de Compras - Migração complementar
-- Adiciona tabelas faltantes e corrige políticas RLS

-- Criar tabelas que faltam (se não existirem)

-- Tabela de itens do pedido de compra
CREATE TABLE IF NOT EXISTS pedidos_compra_itens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_compra_id UUID NOT NULL,
    produto_id UUID,
    sku_produto TEXT NOT NULL,
    nome_produto TEXT NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL CHECK (quantidade > 0),
    valor_unitario DECIMAL(15,2) NOT NULL CHECK (valor_unitario >= 0),
    valor_total DECIMAL(15,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    observacoes TEXT,
    organization_id UUID NOT NULL DEFAULT get_current_org_id(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fornecedores participantes da cotação
CREATE TABLE IF NOT EXISTS cotacoes_fornecedores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cotacao_id UUID NOT NULL,
    fornecedor_id UUID NOT NULL,
    data_envio TIMESTAMP WITH TIME ZONE,
    data_resposta TIMESTAMP WITH TIME ZONE,
    valor_total_proposta DECIMAL(15,2),
    observacoes_fornecedor TEXT,
    organization_id UUID NOT NULL DEFAULT get_current_org_id(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cotacao_id, fornecedor_id)
);

-- Tabela de itens da cotação
CREATE TABLE IF NOT EXISTS cotacoes_itens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cotacao_id UUID NOT NULL,
    produto_id UUID,
    sku_produto TEXT NOT NULL,
    nome_produto TEXT NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL CHECK (quantidade > 0),
    especificacoes TEXT,
    organization_id UUID NOT NULL DEFAULT get_current_org_id(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de propostas dos fornecedores para itens da cotação
CREATE TABLE IF NOT EXISTS cotacoes_propostas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cotacao_fornecedor_id UUID NOT NULL,
    cotacao_item_id UUID NOT NULL,
    valor_unitario DECIMAL(15,2) NOT NULL CHECK (valor_unitario >= 0),
    prazo_entrega INTEGER CHECK (prazo_entrega > 0), -- em dias
    observacoes TEXT,
    organization_id UUID NOT NULL DEFAULT get_current_org_id(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cotacao_fornecedor_id, cotacao_item_id)
);

-- Adicionar foreign keys onde necessário
DO $$
BEGIN
    -- FK para pedidos_compra_itens
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pedidos_compra_itens_pedido_fk') THEN
        ALTER TABLE pedidos_compra_itens ADD CONSTRAINT pedidos_compra_itens_pedido_fk 
        FOREIGN KEY (pedido_compra_id) REFERENCES pedidos_compra(id) ON DELETE CASCADE;
    END IF;
    
    -- FK para cotacoes_fornecedores
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cotacoes_fornecedores_cotacao_fk') THEN
        ALTER TABLE cotacoes_fornecedores ADD CONSTRAINT cotacoes_fornecedores_cotacao_fk 
        FOREIGN KEY (cotacao_id) REFERENCES cotacoes(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cotacoes_fornecedores_fornecedor_fk') THEN
        ALTER TABLE cotacoes_fornecedores ADD CONSTRAINT cotacoes_fornecedores_fornecedor_fk 
        FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE CASCADE;
    END IF;
    
    -- FK para cotacoes_itens
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cotacoes_itens_cotacao_fk') THEN
        ALTER TABLE cotacoes_itens ADD CONSTRAINT cotacoes_itens_cotacao_fk 
        FOREIGN KEY (cotacao_id) REFERENCES cotacoes(id) ON DELETE CASCADE;
    END IF;
    
    -- FK para cotacoes_propostas
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cotacoes_propostas_fornecedor_fk') THEN
        ALTER TABLE cotacoes_propostas ADD CONSTRAINT cotacoes_propostas_fornecedor_fk 
        FOREIGN KEY (cotacao_fornecedor_id) REFERENCES cotacoes_fornecedores(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cotacoes_propostas_item_fk') THEN
        ALTER TABLE cotacoes_propostas ADD CONSTRAINT cotacoes_propostas_item_fk 
        FOREIGN KEY (cotacao_item_id) REFERENCES cotacoes_itens(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_itens_pedido ON pedidos_compra_itens(pedido_compra_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_itens_sku ON pedidos_compra_itens(sku_produto);
CREATE INDEX IF NOT EXISTS idx_cotacoes_fornecedores_cotacao ON cotacoes_fornecedores(cotacao_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_fornecedores_fornecedor ON cotacoes_fornecedores(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_itens_cotacao ON cotacoes_itens(cotacao_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_propostas_fornecedor ON cotacoes_propostas(cotacao_fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_propostas_item ON cotacoes_propostas(cotacao_item_id);

-- RLS (Row Level Security)
ALTER TABLE pedidos_compra_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes_propostas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS seguras por organização
CREATE POLICY "pedidos_compra_itens_org_policy" ON pedidos_compra_itens
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "cotacoes_fornecedores_org_policy" ON cotacoes_fornecedores
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "cotacoes_itens_org_policy" ON cotacoes_itens
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "cotacoes_propostas_org_policy" ON cotacoes_propostas
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- Função para gerar números sequenciais de pedidos
CREATE OR REPLACE FUNCTION gerar_numero_pedido_compra()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
  contador int;
  numero_pedido text;
BEGIN
  org_id := get_current_org_id();
  
  -- Buscar próximo número na sequência
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(numero_pedido FROM 'PC-[0-9]{4}-([0-9]+)') AS INTEGER
    )
  ), 0) + 1
  INTO contador
  FROM pedidos_compra 
  WHERE organization_id = org_id
  AND numero_pedido ~ '^PC-[0-9]{4}-[0-9]+$';
  
  -- Gerar número com ano atual
  numero_pedido := 'PC-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(contador::text, 3, '0');
  
  RETURN numero_pedido;
END;
$$;

-- Função para gerar números sequenciais de cotações
CREATE OR REPLACE FUNCTION gerar_numero_cotacao()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
  contador int;
  numero_cotacao text;
BEGIN
  org_id := get_current_org_id();
  
  -- Buscar próximo número na sequência
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(numero_cotacao FROM 'COT-[0-9]{4}-([0-9]+)') AS INTEGER
    )
  ), 0) + 1
  INTO contador
  FROM cotacoes 
  WHERE organization_id = org_id
  AND numero_cotacao ~ '^COT-[0-9]{4}-[0-9]+$';
  
  -- Gerar número com ano atual
  numero_cotacao := 'COT-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(contador::text, 3, '0');
  
  RETURN numero_cotacao;
END;
$$;