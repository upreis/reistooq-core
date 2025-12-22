-- 1) Remover constraint antiga se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'locais_estoque_tipo_check'
      AND conrelid = 'public.locais_estoque'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.locais_estoque DROP CONSTRAINT locais_estoque_tipo_check';
  END IF;
END $$;

-- 2) Migrar dados ANTES de adicionar nova constraint
UPDATE public.locais_estoque
SET tipo = 'fullfilment'
WHERE tipo IN ('fullfilment_ml', 'fullfilment_shopee');

-- 3) Garantir que nenhum valor nulo
UPDATE public.locais_estoque
SET tipo = 'outro'
WHERE tipo IS NULL OR tipo NOT IN ('principal', 'fullfilment', 'inhouse', 'filial', 'outro');

-- 4) Adicionar nova constraint com valores permitidos
ALTER TABLE public.locais_estoque
ADD CONSTRAINT locais_estoque_tipo_check
CHECK (tipo IN ('principal', 'fullfilment', 'inhouse', 'filial', 'outro'));