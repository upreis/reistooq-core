-- Criar tabela para múltiplas imagens de produtos
CREATE TABLE public.produto_imagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL,
  url_imagem TEXT NOT NULL,
  nome_arquivo TEXT,
  tamanho_arquivo INTEGER,
  tipo_mime TEXT,
  ordem INTEGER DEFAULT 0,
  principal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_produto_imagens_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Criar tabela para categorias dinâmicas
CREATE TABLE public.categorias_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT DEFAULT '#6366f1',
  icone TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, nome)
);

-- Criar tabela para histórico de importações (rollback)
CREATE TABLE public.historico_importacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tipo_operacao TEXT NOT NULL, -- 'import', 'rollback'
  produtos_processados INTEGER DEFAULT 0,
  produtos_sucesso INTEGER DEFAULT 0,
  produtos_erro INTEGER DEFAULT 0,
  detalhes_erro JSONB,
  dados_originais JSONB, -- Para rollback
  usuario_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para tags personalizadas
CREATE TABLE public.produto_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#64748b',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, nome)
);

-- Criar tabela de relacionamento produto-tags
CREATE TABLE public.produto_tag_relacionamentos (
  produto_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (produto_id, tag_id),
  CONSTRAINT fk_produto_tag_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  CONSTRAINT fk_produto_tag_tag FOREIGN KEY (tag_id) REFERENCES produto_tags(id) ON DELETE CASCADE
);

-- Adicionar colunas aos produtos para novas funcionalidades
ALTER TABLE produtos ADD COLUMN categoria_id UUID;
ALTER TABLE produtos ADD COLUMN sku_gerado_automaticamente BOOLEAN DEFAULT false;
ALTER TABLE produtos ADD COLUMN produto_origem_id UUID; -- Para duplicação
ALTER TABLE produtos ADD COLUMN versao INTEGER DEFAULT 1;

-- Índices para performance
CREATE INDEX idx_produto_imagens_produto_id ON produto_imagens(produto_id);
CREATE INDEX idx_produto_imagens_principal ON produto_imagens(produto_id, principal) WHERE principal = true;
CREATE INDEX idx_categorias_organization ON categorias_produtos(organization_id);
CREATE INDEX idx_historico_importacoes_org ON historico_importacoes(organization_id);
CREATE INDEX idx_produto_tags_org ON produto_tags(organization_id);
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_origem ON produtos(produto_origem_id);

-- RLS Policies para produto_imagens
ALTER TABLE produto_imagens ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies para categorias_produtos
ALTER TABLE categorias_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias: select org" ON categorias_produtos
FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "categorias: mutate org" ON categorias_produtos
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- RLS Policies para histórico_importacoes
ALTER TABLE historico_importacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historico_importacoes: select org" ON historico_importacoes
FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "historico_importacoes: insert org" ON historico_importacoes
FOR INSERT WITH CHECK (organization_id = get_current_org_id());

-- RLS Policies para produto_tags
ALTER TABLE produto_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produto_tags: select org" ON produto_tags
FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "produto_tags: mutate org" ON produto_tags
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- RLS Policies para produto_tag_relacionamentos
ALTER TABLE produto_tag_relacionamentos ENABLE ROW LEVEL SECURITY;

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
RETURNS TRIGGER AS $$
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

CREATE TRIGGER trigger_ensure_single_main_image
  BEFORE INSERT OR UPDATE ON produto_imagens
  FOR EACH ROW
  WHEN (NEW.principal = true)
  EXECUTE FUNCTION ensure_single_main_image();

-- Função para gerar SKU automático
CREATE OR REPLACE FUNCTION public.gerar_sku_automatico(org_id uuid, prefixo text DEFAULT 'PROD')
RETURNS text AS $$
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
CREATE TRIGGER update_produto_imagens_updated_at
  BEFORE UPDATE ON produto_imagens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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