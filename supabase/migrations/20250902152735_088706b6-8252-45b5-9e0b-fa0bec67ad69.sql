-- Etapa 1: Criar tabela de unidades de medida
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

-- Etapa 2: Inserir unidades padrão para todas as organizações existentes
INSERT INTO public.unidades_medida (organization_id, nome, abreviacao, tipo, unidade_base, fator_conversao)
SELECT 
  o.id,
  unnest(ARRAY['Metro', 'Centímetro', 'Milímetro', 'Quilograma', 'Grama', 'Litro', 'Mililitro', 'Metro Cúbico', 'Unidade', 'Caixa', 'Dúzia', 'Centena']),
  unnest(ARRAY['m', 'cm', 'mm', 'kg', 'g', 'L', 'mL', 'm³', 'un', 'cx', 'dz', 'ct']),
  unnest(ARRAY['comprimento', 'comprimento', 'comprimento', 'massa', 'massa', 'volume', 'volume', 'volume', 'contagem', 'contagem', 'contagem', 'contagem']),
  unnest(ARRAY[true, false, false, true, false, true, false, false, true, false, false, false]),
  unnest(ARRAY[1, 0.01, 0.001, 1, 0.001, 1, 0.001, 1000, 1, 12, 12, 100])
FROM public.organizacoes o;