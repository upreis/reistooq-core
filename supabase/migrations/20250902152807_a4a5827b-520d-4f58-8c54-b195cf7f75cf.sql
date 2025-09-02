-- Etapa 3: Adicionar campo unidade_medida_id na tabela produtos (nullable inicialmente)
ALTER TABLE public.produtos 
ADD COLUMN unidade_medida_id uuid REFERENCES public.unidades_medida(id);

-- Etapa 4: Atualizar todos os produtos existentes com unidade padrão "Unidade"
UPDATE public.produtos 
SET unidade_medida_id = (
  SELECT id FROM public.unidades_medida 
  WHERE organization_id = produtos.organization_id 
  AND abreviacao = 'un' 
  LIMIT 1
)
WHERE unidade_medida_id IS NULL;

-- Etapa 5: Verificar se ainda existem produtos com unidade_medida_id NULL
-- Se existirem, criar uma unidade padrão para eles
DO $$
DECLARE
  produto_record RECORD;
  unidade_padrao_id uuid;
BEGIN
  FOR produto_record IN 
    SELECT DISTINCT organization_id 
    FROM public.produtos 
    WHERE unidade_medida_id IS NULL
  LOOP
    -- Criar unidade padrão se não existir
    INSERT INTO public.unidades_medida (organization_id, nome, abreviacao, tipo, unidade_base, fator_conversao)
    VALUES (produto_record.organization_id, 'Unidade', 'un', 'contagem', true, 1)
    ON CONFLICT (organization_id, abreviacao) DO NOTHING;
    
    -- Atualizar produtos desta organização
    UPDATE public.produtos 
    SET unidade_medida_id = (
      SELECT id FROM public.unidades_medida 
      WHERE organization_id = produto_record.organization_id 
      AND abreviacao = 'un' 
      LIMIT 1
    )
    WHERE organization_id = produto_record.organization_id 
    AND unidade_medida_id IS NULL;
  END LOOP;
END $$;

-- Etapa 6: Agora tornar o campo obrigatório
ALTER TABLE public.produtos 
ALTER COLUMN unidade_medida_id SET NOT NULL;