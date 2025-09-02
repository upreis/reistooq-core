-- Criar tabela de unidades de medida padronizadas
CREATE TABLE public.unidades_medida (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  abreviacao text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('comprimento', 'massa', 'volume', 'contagem')),
  unidade_base boolean NOT NULL DEFAULT false,
  fator_conversao numeric NOT NULL DEFAULT 1,
  organization_id uuid NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, abreviacao)
);

-- Inserir unidades padrão para cada organização (será feito via trigger)
CREATE OR REPLACE FUNCTION public.inserir_unidades_padrao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Inserir unidades de comprimento
  INSERT INTO public.unidades_medida (organization_id, nome, abreviacao, tipo, unidade_base, fator_conversao) VALUES
  (NEW.id, 'Metro', 'm', 'comprimento', true, 1),
  (NEW.id, 'Centímetro', 'cm', 'comprimento', false, 0.01),
  (NEW.id, 'Milímetro', 'mm', 'comprimento', false, 0.001),
  -- Unidades de massa
  (NEW.id, 'Quilograma', 'kg', 'massa', true, 1),
  (NEW.id, 'Grama', 'g', 'massa', false, 0.001),
  -- Unidades de volume
  (NEW.id, 'Litro', 'L', 'volume', true, 1),
  (NEW.id, 'Mililitro', 'mL', 'volume', false, 0.001),
  (NEW.id, 'Metro Cúbico', 'm³', 'volume', false, 1000),
  -- Unidades de contagem
  (NEW.id, 'Unidade', 'un', 'contagem', true, 1),
  (NEW.id, 'Caixa', 'cx', 'contagem', false, 12),
  (NEW.id, 'Dúzia', 'dz', 'contagem', false, 12),
  (NEW.id, 'Centena', 'ct', 'contagem', false, 100);
  
  RETURN NEW;
END;
$$;

-- Trigger para inserir unidades padrão quando uma nova organização é criada
CREATE TRIGGER trigger_inserir_unidades_padrao
  AFTER INSERT ON public.organizacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.inserir_unidades_padrao();

-- Adicionar campo unidade_medida_id na tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN unidade_medida_id uuid REFERENCES public.unidades_medida(id);

-- Atualizar produtos existentes com unidade padrão "Unidade"
UPDATE public.produtos 
SET unidade_medida_id = (
  SELECT id FROM public.unidades_medida 
  WHERE organization_id = produtos.organization_id 
  AND abreviacao = 'un' 
  LIMIT 1
)
WHERE unidade_medida_id IS NULL;

-- Tornar o campo obrigatório após preencher valores existentes
ALTER TABLE public.produtos 
ALTER COLUMN unidade_medida_id SET NOT NULL;

-- Modificar tabela produto_componentes para referenciar unidade
ALTER TABLE public.produto_componentes 
DROP COLUMN unidade_medida;

ALTER TABLE public.produto_componentes 
ADD COLUMN unidade_medida_id uuid REFERENCES public.unidades_medida(id);

-- Função para converter quantidade entre unidades
CREATE OR REPLACE FUNCTION public.converter_quantidade(
  quantidade_origem numeric,
  unidade_origem_id uuid,
  unidade_destino_id uuid
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fator_origem numeric;
  fator_destino numeric;
  tipo_origem text;
  tipo_destino text;
BEGIN
  -- Buscar fatores de conversão e tipos
  SELECT fator_conversao, tipo INTO fator_origem, tipo_origem
  FROM public.unidades_medida WHERE id = unidade_origem_id;
  
  SELECT fator_conversao, tipo INTO fator_destino, tipo_destino
  FROM public.unidades_medida WHERE id = unidade_destino_id;
  
  -- Verificar se os tipos são compatíveis
  IF tipo_origem != tipo_destino THEN
    RAISE EXCEPTION 'Não é possível converter entre tipos diferentes: % e %', tipo_origem, tipo_destino;
  END IF;
  
  -- Converter para unidade base e depois para unidade destino
  RETURN (quantidade_origem * fator_origem) / fator_destino;
END;
$$;

-- RLS policies para unidades_medida
ALTER TABLE public.unidades_medida ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unidades_medida: org select" 
ON public.unidades_medida 
FOR SELECT 
USING (organization_id = get_current_org_id());

CREATE POLICY "unidades_medida: org mutate" 
ON public.unidades_medida 
FOR ALL 
USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_unidades_medida_updated_at
  BEFORE UPDATE ON public.unidades_medida
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir unidades padrão para organizações existentes
INSERT INTO public.unidades_medida (organization_id, nome, abreviacao, tipo, unidade_base, fator_conversao)
SELECT 
  o.id,
  unnest(ARRAY['Metro', 'Centímetro', 'Milímetro', 'Quilograma', 'Grama', 'Litro', 'Mililitro', 'Metro Cúbico', 'Unidade', 'Caixa', 'Dúzia', 'Centena']),
  unnest(ARRAY['m', 'cm', 'mm', 'kg', 'g', 'L', 'mL', 'm³', 'un', 'cx', 'dz', 'ct']),
  unnest(ARRAY['comprimento', 'comprimento', 'comprimento', 'massa', 'massa', 'volume', 'volume', 'volume', 'contagem', 'contagem', 'contagem', 'contagem']),
  unnest(ARRAY[true, false, false, true, false, true, false, false, true, false, false, false]),
  unnest(ARRAY[1, 0.01, 0.001, 1, 0.001, 1, 0.001, 1000, 1, 12, 12, 100])
FROM public.organizacoes o
WHERE NOT EXISTS (
  SELECT 1 FROM public.unidades_medida um 
  WHERE um.organization_id = o.id
);