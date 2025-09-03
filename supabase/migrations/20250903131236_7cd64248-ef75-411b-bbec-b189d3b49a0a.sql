-- Criar tabela separada para produtos de composições
CREATE TABLE public.produtos_composicoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_interno text NOT NULL,
  nome text NOT NULL,
  descricao text,
  categoria text,
  subcategoria text,
  categoria_principal text,
  categoria_nivel2 text,
  preco_venda numeric DEFAULT 0,
  preco_custo numeric DEFAULT 0,
  quantidade_atual integer DEFAULT 0,
  estoque_minimo integer DEFAULT 0,
  url_imagem text,
  codigo_barras text,
  status text DEFAULT 'active',
  ativo boolean DEFAULT true,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Índices para performance
  CONSTRAINT produtos_composicoes_sku_org_unique UNIQUE (sku_interno, organization_id)
);

-- Índices
CREATE INDEX idx_produtos_composicoes_org ON public.produtos_composicoes(organization_id);
CREATE INDEX idx_produtos_composicoes_sku ON public.produtos_composicoes(sku_interno);
CREATE INDEX idx_produtos_composicoes_categoria ON public.produtos_composicoes(categoria_principal);

-- RLS policies
ALTER TABLE public.produtos_composicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_composicoes_org_select" ON public.produtos_composicoes
FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "produtos_composicoes_org_insert" ON public.produtos_composicoes
FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "produtos_composicoes_org_update" ON public.produtos_composicoes
FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "produtos_composicoes_org_delete" ON public.produtos_composicoes
FOR DELETE USING (organization_id = get_current_org_id());

-- Trigger para auto-set organization_id
CREATE OR REPLACE FUNCTION public.set_produtos_composicoes_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id = public.get_current_org_id();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_produtos_composicoes_org_trigger
  BEFORE INSERT ON public.produtos_composicoes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_produtos_composicoes_organization();

-- Trigger para updated_at
CREATE TRIGGER update_produtos_composicoes_updated_at
  BEFORE UPDATE ON public.produtos_composicoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_roles_updated_at();

-- Tabela para rastrear componentes em uso (para avisos)
CREATE TABLE public.componentes_em_uso (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_componente text NOT NULL,
  sku_produto_composicao text NOT NULL,
  nome_produto_composicao text NOT NULL,
  quantidade_necessaria numeric NOT NULL DEFAULT 0,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT componentes_em_uso_unique UNIQUE (sku_componente, sku_produto_composicao, organization_id)
);

-- RLS para componentes_em_uso
ALTER TABLE public.componentes_em_uso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "componentes_em_uso_org_all" ON public.componentes_em_uso
FOR ALL USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- Trigger para auto-set organization_id
CREATE TRIGGER set_componentes_em_uso_org_trigger
  BEFORE INSERT ON public.componentes_em_uso
  FOR EACH ROW
  EXECUTE FUNCTION public.set_produtos_composicoes_organization();

-- Função para verificar componentes em uso antes de deletar
CREATE OR REPLACE FUNCTION public.verificar_componentes_antes_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  componentes_usando text[];
  produtos_afetados text;
BEGIN
  -- Buscar produtos de composições que usam este componente
  SELECT array_agg(DISTINCT nome_produto_composicao) INTO componentes_usando
  FROM public.componentes_em_uso
  WHERE sku_componente = OLD.sku_interno 
    AND organization_id = OLD.organization_id;
    
  -- Se há produtos usando este componente, impedir a exclusão
  IF array_length(componentes_usando, 1) > 0 THEN
    produtos_afetados := array_to_string(componentes_usando, ', ');
    RAISE EXCEPTION 'COMPONENTE_EM_USO: Este componente está sendo usado nas seguintes composições: %. Remova-o das composições antes de excluir ou substitua por outro componente.', produtos_afetados
      USING HINT = 'Vá até a aba Composições e edite os produtos afetados';
  END IF;
  
  RETURN OLD;
END;
$function$;

-- Trigger para verificar antes de deletar produtos do estoque
CREATE TRIGGER verificar_componentes_antes_delete_trigger
  BEFORE DELETE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.verificar_componentes_antes_delete();

-- Função para sincronizar componentes em uso
CREATE OR REPLACE FUNCTION public.sincronizar_componentes_em_uso()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Limpar registros antigos
  DELETE FROM public.componentes_em_uso 
  WHERE organization_id = get_current_org_id();
  
  -- Inserir componentes atualmente em uso
  INSERT INTO public.componentes_em_uso (
    sku_componente, 
    sku_produto_composicao, 
    nome_produto_composicao, 
    quantidade_necessaria,
    organization_id
  )
  SELECT DISTINCT
    pc.sku_componente,
    pc.sku_produto,
    COALESCE(pcomp.nome, pc.sku_produto) as nome_produto,
    pc.quantidade,
    get_current_org_id()
  FROM public.produto_componentes pc
  LEFT JOIN public.produtos_composicoes pcomp ON pcomp.sku_interno = pc.sku_produto 
    AND pcomp.organization_id = get_current_org_id()
  WHERE EXISTS (
    SELECT 1 FROM public.produtos p 
    WHERE p.sku_interno = pc.sku_componente 
      AND p.organization_id = get_current_org_id()
  );
END;
$function$;