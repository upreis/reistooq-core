-- Sistema de Compras - Apenas funções auxiliares
-- Não insere dados de exemplo para evitar problemas de organização

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
  
  -- Se não conseguir obter org_id, usar contador global simples
  IF org_id IS NULL THEN
    SELECT COALESCE(MAX(
      CAST(
        SUBSTRING(numero_pedido FROM 'PC-[0-9]{4}-([0-9]+)') AS INTEGER
      )
    ), 0) + 1
    INTO contador
    FROM pedidos_compra 
    WHERE numero_pedido ~ '^PC-[0-9]{4}-[0-9]+$';
  ELSE
    -- Buscar próximo número na sequência por organização
    SELECT COALESCE(MAX(
      CAST(
        SUBSTRING(numero_pedido FROM 'PC-[0-9]{4}-([0-9]+)') AS INTEGER
      )
    ), 0) + 1
    INTO contador
    FROM pedidos_compra 
    WHERE organization_id = org_id
    AND numero_pedido ~ '^PC-[0-9]{4}-[0-9]+$';
  END IF;
  
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
  
  -- Se não conseguir obter org_id, usar contador global simples
  IF org_id IS NULL THEN
    SELECT COALESCE(MAX(
      CAST(
        SUBSTRING(numero_cotacao FROM 'COT-[0-9]{4}-([0-9]+)') AS INTEGER
      )
    ), 0) + 1
    INTO contador
    FROM cotacoes 
    WHERE numero_cotacao ~ '^COT-[0-9]{4}-[0-9]+$';
  ELSE
    -- Buscar próximo número na sequência por organização
    SELECT COALESCE(MAX(
      CAST(
        SUBSTRING(numero_cotacao FROM 'COT-[0-9]{4}-([0-9]+)') AS INTEGER
      )
    ), 0) + 1
    INTO contador
    FROM cotacoes 
    WHERE organization_id = org_id
    AND numero_cotacao ~ '^COT-[0-9]{4}-[0-9]+$';
  END IF;
  
  -- Gerar número com ano atual
  numero_cotacao := 'COT-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(contador::text, 3, '0');
  
  RETURN numero_cotacao;
END;
$$;