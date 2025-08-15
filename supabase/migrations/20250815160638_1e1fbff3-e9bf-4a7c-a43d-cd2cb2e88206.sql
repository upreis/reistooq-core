-- Remover os índices que já existem para evitar conflito
DROP INDEX IF EXISTS idx_produtos_categoria;

-- Agora podemos executar a migração principal
-- Criar tabela para múltiplas imagens de produtos
CREATE TABLE IF NOT EXISTS public.produto_imagens (
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
CREATE TABLE IF NOT EXISTS public.categorias_produtos (
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
CREATE TABLE IF NOT EXISTS public.historico_importacoes (
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
CREATE TABLE IF NOT EXISTS public.produto_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#64748b',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, nome)
);

-- Criar tabela de relacionamento produto-tags
CREATE TABLE IF NOT EXISTS public.produto_tag_relacionamentos (
  produto_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (produto_id, tag_id),
  CONSTRAINT fk_produto_tag_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  CONSTRAINT fk_produto_tag_tag FOREIGN KEY (tag_id) REFERENCES produto_tags(id) ON DELETE CASCADE
);

-- Adicionar colunas aos produtos apenas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'categoria_id') THEN
    ALTER TABLE produtos ADD COLUMN categoria_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'sku_gerado_automaticamente') THEN
    ALTER TABLE produtos ADD COLUMN sku_gerado_automaticamente BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'produto_origem_id') THEN
    ALTER TABLE produtos ADD COLUMN produto_origem_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'versao') THEN
    ALTER TABLE produtos ADD COLUMN versao INTEGER DEFAULT 1;
  END IF;
END $$;

-- Criar índices apenas se não existirem
CREATE INDEX IF NOT EXISTS idx_produto_imagens_produto_id ON produto_imagens(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_imagens_principal ON produto_imagens(produto_id, principal) WHERE principal = true;
CREATE INDEX IF NOT EXISTS idx_categorias_organization ON categorias_produtos(organization_id);
CREATE INDEX IF NOT EXISTS idx_historico_importacoes_org ON historico_importacoes(organization_id);
CREATE INDEX IF NOT EXISTS idx_produto_tags_org ON produto_tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_origem ON produtos(produto_origem_id);

-- Habilitar RLS apenas se não estiver habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'produto_imagens' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE produto_imagens ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

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