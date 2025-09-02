-- Adicionar campo unidade_medida_id na tabela produtos (nullable inicialmente)
ALTER TABLE public.produtos 
ADD COLUMN unidade_medida_id uuid REFERENCES public.unidades_medida(id);

-- Criar unidade padrão para produtos que têm organization_id
UPDATE public.produtos 
SET unidade_medida_id = (
  SELECT id FROM public.unidades_medida 
  WHERE organization_id = produtos.organization_id 
  AND abreviacao = 'un' 
  LIMIT 1
)
WHERE unidade_medida_id IS NULL 
AND organization_id IS NOT NULL;

-- Para produtos sem organization_id, vamos usar a primeira organização disponível
-- ou pular o update (eles não poderão ser acessados mesmo)
UPDATE public.produtos 
SET unidade_medida_id = (
  SELECT id FROM public.unidades_medida 
  WHERE abreviacao = 'un' 
  LIMIT 1
)
WHERE unidade_medida_id IS NULL 
AND organization_id IS NULL;

-- Verificar quantos produtos ainda estão NULL
-- Se ainda houver, vamos criar uma unidade genérica
DO $$
DECLARE
  null_count integer;
  primeira_org_id uuid;
  unidade_generica_id uuid;
BEGIN
  SELECT COUNT(*) INTO null_count 
  FROM public.produtos 
  WHERE unidade_medida_id IS NULL;
  
  IF null_count > 0 THEN
    -- Pegar a primeira organização
    SELECT id INTO primeira_org_id 
    FROM public.organizacoes 
    LIMIT 1;
    
    IF primeira_org_id IS NOT NULL THEN
      -- Buscar ou criar unidade padrão
      SELECT id INTO unidade_generica_id
      FROM public.unidades_medida 
      WHERE organization_id = primeira_org_id 
      AND abreviacao = 'un';
      
      -- Atualizar produtos restantes
      UPDATE public.produtos 
      SET unidade_medida_id = unidade_generica_id
      WHERE unidade_medida_id IS NULL;
    END IF;
  END IF;
END $$;

-- Tornar o campo obrigatório apenas se não há mais NULLs
DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count 
  FROM public.produtos 
  WHERE unidade_medida_id IS NULL;
  
  IF null_count = 0 THEN
    ALTER TABLE public.produtos 
    ALTER COLUMN unidade_medida_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'Ainda existem % produtos com unidade_medida_id NULL', null_count;
  END IF;
END $$;