-- Remover dados de exemplo que causaram erro
-- As tabelas já foram criadas na migração anterior

-- Função para inserir produtos de exemplo apenas se o usuário tiver uma organização
CREATE OR REPLACE FUNCTION seed_oms_sample_data()
RETURNS VOID AS $$
DECLARE
  org_id UUID;
BEGIN
  org_id := get_current_org_id();
  
  IF org_id IS NOT NULL THEN
    -- Inserir produtos de exemplo
    INSERT INTO oms_products (organization_id, sku, title, price) VALUES
    (org_id, 'PROD-001', 'Produto Exemplo 1', 29.90),
    (org_id, 'PROD-002', 'Produto Exemplo 2', 49.90),
    (org_id, 'PROD-003', 'Produto Exemplo 3', 99.90)
    ON CONFLICT (organization_id, sku) DO NOTHING;
    
    -- Inserir representante de exemplo
    INSERT INTO oms_sales_reps (organization_id, name, email, phone) VALUES
    (org_id, 'João Silva', 'joao@empresa.com', '(11) 99999-9999')
    ON CONFLICT DO NOTHING;
    
    -- Inserir cliente de exemplo
    INSERT INTO oms_customers (organization_id, name, doc, email, phone, price_tier) VALUES
    (org_id, 'Cliente Exemplo', '12.345.678/0001-90', 'cliente@empresa.com', '(11) 88888-8888', 'standard')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;