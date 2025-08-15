-- Habilitar RLS em todas as novas tabelas
ALTER TABLE categorias_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_importacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_tag_relacionamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para produto_imagens
DROP POLICY IF EXISTS "produto_imagens: select org" ON produto_imagens;
DROP POLICY IF EXISTS "produto_imagens: mutate org" ON produto_imagens;

CREATE POLICY "produto_imagens: select org" ON produto_imagens
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM produtos p 
    WHERE p.id = produto_imagens.produto_id 
    AND p.organization_id = get_current_org_id()
  )
);

CREATE POLICY "produto_imagens: mutate org" ON produto_imagens
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM produtos p 
    WHERE p.id = produto_imagens.produto_id 
    AND p.organization_id = get_current_org_id()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM produtos p 
    WHERE p.id = produto_imagens.produto_id 
    AND p.organization_id = get_current_org_id()
  )
);

-- Políticas RLS para categorias_produtos
CREATE POLICY "categorias: select org" ON categorias_produtos
FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "categorias: mutate org" ON categorias_produtos
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- Políticas RLS para histórico_importacoes
CREATE POLICY "historico_importacoes: select org" ON historico_importacoes
FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "historico_importacoes: insert org" ON historico_importacoes
FOR INSERT WITH CHECK (organization_id = get_current_org_id());

-- Políticas RLS para produto_tags
CREATE POLICY "produto_tags: select org" ON produto_tags
FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "produto_tags: mutate org" ON produto_tags
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- Políticas RLS para produto_tag_relacionamentos
CREATE POLICY "produto_tag_rel: select org" ON produto_tag_relacionamentos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM produtos p 
    WHERE p.id = produto_tag_relacionamentos.produto_id 
    AND p.organization_id = get_current_org_id()
  )
);

CREATE POLICY "produto_tag_rel: mutate org" ON produto_tag_relacionamentos
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM produtos p 
    WHERE p.id = produto_tag_relacionamentos.produto_id 
    AND p.organization_id = get_current_org_id()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM produtos p 
    WHERE p.id = produto_tag_relacionamentos.produto_id 
    AND p.organization_id = get_current_org_id()
  )
);

-- Trigger para manter apenas uma imagem principal por produto
CREATE OR REPLACE FUNCTION public.ensure_single_main_image()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.principal = true THEN
    UPDATE produto_imagens 
    SET principal = false 
    WHERE produto_id = NEW.produto_id 
    AND id != NEW.id 
    AND principal = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_main_image ON produto_imagens;
CREATE TRIGGER trigger_ensure_single_main_image
  BEFORE INSERT OR UPDATE ON produto_imagens
  FOR EACH ROW
  WHEN (NEW.principal = true)
  EXECUTE FUNCTION ensure_single_main_image();

-- Corrigir função gerar_sku_automatico para ter search_path seguro
CREATE OR REPLACE FUNCTION public.gerar_sku_automatico(org_id uuid, prefixo text DEFAULT 'PROD')
RETURNS text 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  numero_sequencia integer;
  novo_sku text;
BEGIN
  -- Buscar o próximo número na sequência
  SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(sku_interno, '^' || prefixo || '-', '') AS INTEGER)), 0) + 1
  INTO numero_sequencia
  FROM produtos 
  WHERE organization_id = org_id 
  AND sku_interno ~ ('^' || prefixo || '-[0-9]+$');
  
  -- Formatar SKU com zero padding
  novo_sku := prefixo || '-' || LPAD(numero_sequencia::text, 6, '0');
  
  RETURN novo_sku;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at nas novas tabelas
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_produto_imagens_updated_at ON produto_imagens;
CREATE TRIGGER update_produto_imagens_updated_at
  BEFORE UPDATE ON produto_imagens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categorias_produtos_updated_at ON categorias_produtos;
CREATE TRIGGER update_categorias_produtos_updated_at
  BEFORE UPDATE ON categorias_produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir categorias padrão para organizações existentes
INSERT INTO categorias_produtos (organization_id, nome, cor, icone, ordem)
SELECT DISTINCT p.organization_id, 'Acessórios para Veículos', '#ef4444', 'Car', 1
FROM produtos p
WHERE p.organization_id IS NOT NULL
ON CONFLICT (organization_id, nome) DO NOTHING;

INSERT INTO categorias_produtos (organization_id, nome, cor, icone, ordem)
SELECT DISTINCT p.organization_id, 'Alimentos e Bebidas', '#f97316', 'Coffee', 2
FROM produtos p
WHERE p.organization_id IS NOT NULL
ON CONFLICT (organization_id, nome) DO NOTHING;

INSERT INTO categorias_produtos (organization_id, nome, cor, icone, ordem)
SELECT DISTINCT p.organization_id, 'Beleza e Cuidado Pessoal', '#ec4899', 'Sparkles', 3
FROM produtos p
WHERE p.organization_id IS NOT NULL
ON CONFLICT (organization_id, nome) DO NOTHING;

INSERT INTO categorias_produtos (organization_id, nome, cor, icone, ordem)
SELECT DISTINCT p.organization_id, 'Eletrônicos', '#3b82f6', 'Smartphone', 4
FROM produtos p
WHERE p.organization_id IS NOT NULL
ON CONFLICT (organization_id, nome) DO NOTHING;

INSERT INTO categorias_produtos (organization_id, nome, cor, icone, ordem)
SELECT DISTINCT p.organization_id, 'Casa e Decoração', '#10b981', 'Home', 5
FROM produtos p
WHERE p.organization_id IS NOT NULL
ON CONFLICT (organization_id, nome) DO NOTHING;