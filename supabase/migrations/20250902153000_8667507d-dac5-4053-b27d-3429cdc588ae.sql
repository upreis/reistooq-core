-- Completar a configuração das unidades de medida

-- Modificar tabela produto_componentes para usar unidade_medida_id
ALTER TABLE public.produto_componentes 
DROP COLUMN IF EXISTS unidade_medida;

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

-- Função para trigger que inserirá unidades padrão para novas organizações
CREATE OR REPLACE FUNCTION public.inserir_unidades_padrao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Inserir unidades padrão para a nova organização
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
DROP TRIGGER IF EXISTS trigger_inserir_unidades_padrao ON public.organizacoes;
CREATE TRIGGER trigger_inserir_unidades_padrao
  AFTER INSERT ON public.organizacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.inserir_unidades_padrao();