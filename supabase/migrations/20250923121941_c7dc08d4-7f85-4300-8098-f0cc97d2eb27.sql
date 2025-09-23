-- Sistema de Compras - Finalização e dados de exemplo
-- Adiciona apenas funções auxiliares e dados de exemplo

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

-- Inserir dados de exemplo apenas se não existirem fornecedores
DO $$
DECLARE
  org_id uuid;
  fornecedores_count int;
BEGIN
  org_id := get_current_org_id();
  
  -- Verificar se já existem fornecedores para esta organização
  SELECT COUNT(*) INTO fornecedores_count 
  FROM fornecedores 
  WHERE organization_id = org_id;
  
  -- Se não existem fornecedores, inserir dados de exemplo
  IF fornecedores_count = 0 THEN
    INSERT INTO fornecedores (nome, cnpj, email, telefone, categoria, avaliacao, ativo, organization_id) VALUES
    ('Fornecedor Premium Ltda', '12.345.678/0001-90', 'contato@premium.com', '(11) 99999-1111', 'materiais', 5, true, org_id),
    ('Distribuidora Nacional S.A.', '98.765.432/0001-10', 'vendas@nacional.com', '(11) 88888-2222', 'equipamentos', 4, true, org_id),
    ('Tech Solutions Corp', '11.222.333/0001-44', 'info@techsolutions.com', '(11) 77777-3333', 'tecnologia', 5, true, org_id),
    ('Materiais & Cia', '55.666.777/0001-88', 'pedidos@materiais.com', '(11) 66666-4444', 'materiais', 3, true, org_id),
    ('Serviços Especializados', '99.888.777/0001-66', 'contato@servicos.com', '(11) 55555-5555', 'servicos', 4, false, org_id);
    
    -- Inserir pedidos de exemplo
    INSERT INTO pedidos_compra (numero_pedido, fornecedor_id, data_pedido, data_entrega_prevista, status, valor_total, observacoes, organization_id) VALUES
    ('PC-2024-001', (SELECT id FROM fornecedores WHERE nome = 'Fornecedor Premium Ltda' AND organization_id = org_id), CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 'aprovado', 15750.50, 'Pedido urgente para reposição de estoque', org_id),
    ('PC-2024-002', (SELECT id FROM fornecedores WHERE nome = 'Distribuidora Nacional S.A.' AND organization_id = org_id), CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '15 days', 'em_andamento', 8920.30, 'Equipamentos para expansão', org_id),
    ('PC-2024-003', (SELECT id FROM fornecedores WHERE nome = 'Tech Solutions Corp' AND organization_id = org_id), CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '7 days', 'pendente', 25600.00, 'Atualização de infraestrutura de TI', org_id);
    
    -- Inserir cotações de exemplo
    INSERT INTO cotacoes (numero_cotacao, descricao, data_abertura, data_fechamento, status, observacoes, organization_id) VALUES
    ('COT-2024-001', 'Cotação para materiais de escritório', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days', 'fechada', 'Cotação para suprimentos do primeiro trimestre', org_id),
    ('COT-2024-002', 'Equipamentos de segurança', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', 'enviada', 'Equipamentos para adequação às normas de segurança', org_id),
    ('COT-2024-003', 'Serviços de manutenção', CURRENT_DATE - INTERVAL '2 days', NULL, 'aberta', 'Cotação para contratos anuais de manutenção', org_id);
  END IF;
END
$$;