-- Criar tabela para composições de produtos (BOM - Bill of Materials)
CREATE TABLE public.produto_componentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_produto TEXT NOT NULL, -- SKU do produto final
  sku_componente TEXT NOT NULL, -- SKU do componente/insumo
  nome_componente TEXT NOT NULL, -- Nome do componente para exibição
  quantidade NUMERIC NOT NULL DEFAULT 1, -- Quantidade necessária
  unidade_medida TEXT DEFAULT 'un', -- un, kg, ml, etc
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT produto_componentes_quantidade_check CHECK (quantidade > 0),
  CONSTRAINT produto_componentes_unique_per_org UNIQUE (sku_produto, sku_componente, organization_id)
);

-- Enable RLS
ALTER TABLE public.produto_componentes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "produto_componentes_select_org" 
ON public.produto_componentes 
FOR SELECT 
USING (organization_id = get_current_org_id());

CREATE POLICY "produto_componentes_mutate_org" 
ON public.produto_componentes 
FOR ALL 
USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- Trigger para setar organization_id automaticamente
CREATE OR REPLACE FUNCTION public.set_produto_componentes_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id = public.get_current_org_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_produto_componentes_org_trigger
  BEFORE INSERT ON public.produto_componentes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_produto_componentes_organization();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_produto_componentes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_produto_componentes_updated_at_trigger
  BEFORE UPDATE ON public.produto_componentes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_produto_componentes_updated_at();

-- Índices para performance
CREATE INDEX idx_produto_componentes_sku_produto ON public.produto_componentes(sku_produto);
CREATE INDEX idx_produto_componentes_org_id ON public.produto_componentes(organization_id);
CREATE INDEX idx_produto_componentes_sku_componente ON public.produto_componentes(sku_componente);