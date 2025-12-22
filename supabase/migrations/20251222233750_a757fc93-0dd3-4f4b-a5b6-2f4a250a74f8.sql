-- Tabela de Locais de Venda
CREATE TABLE public.locais_venda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'marketplace', -- marketplace, loja_fisica, atacado, outro
  local_estoque_id UUID REFERENCES public.locais_estoque(id) ON DELETE SET NULL, -- Vinculado a um local de estoque
  descricao TEXT,
  icone TEXT DEFAULT '🛒',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_locais_venda_org ON public.locais_venda(organization_id);
CREATE INDEX idx_locais_venda_estoque ON public.locais_venda(local_estoque_id);

-- Habilitar RLS
ALTER TABLE public.locais_venda ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "locais_venda_org_select" ON public.locais_venda
  FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "locais_venda_org_insert" ON public.locais_venda
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "locais_venda_org_update" ON public.locais_venda
  FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "locais_venda_org_delete" ON public.locais_venda
  FOR DELETE USING (organization_id = get_current_org_id());

-- Tabela de Composições por Local de Venda
CREATE TABLE public.composicoes_local_venda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  local_venda_id UUID NOT NULL REFERENCES public.locais_venda(id) ON DELETE CASCADE,
  sku_produto TEXT NOT NULL,
  sku_insumo TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(local_venda_id, sku_produto, sku_insumo)
);

-- Índices
CREATE INDEX idx_composicoes_lv_org ON public.composicoes_local_venda(organization_id);
CREATE INDEX idx_composicoes_lv_local ON public.composicoes_local_venda(local_venda_id);
CREATE INDEX idx_composicoes_lv_produto ON public.composicoes_local_venda(sku_produto);

-- Habilitar RLS
ALTER TABLE public.composicoes_local_venda ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "composicoes_lv_org_select" ON public.composicoes_local_venda
  FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "composicoes_lv_org_insert" ON public.composicoes_local_venda
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "composicoes_lv_org_update" ON public.composicoes_local_venda
  FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "composicoes_lv_org_delete" ON public.composicoes_local_venda
  FOR DELETE USING (organization_id = get_current_org_id());

-- Trigger para updated_at
CREATE TRIGGER update_locais_venda_updated_at
  BEFORE UPDATE ON public.locais_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_composicoes_lv_updated_at
  BEFORE UPDATE ON public.composicoes_local_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.locais_venda IS 'Locais de venda (canais) com composições específicas de insumos';
COMMENT ON TABLE public.composicoes_local_venda IS 'Composições de insumos específicas por local de venda';
COMMENT ON COLUMN public.locais_venda.local_estoque_id IS 'Local de estoque vinculado de onde os insumos serão retirados';