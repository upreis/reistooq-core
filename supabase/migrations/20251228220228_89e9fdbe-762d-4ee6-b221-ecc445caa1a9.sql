-- Adiciona coluna para indicar se é Produto ou Insumo
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS tipo_item text DEFAULT 'produto';

-- Adiciona coluna para especificar o tipo de insumo quando for insumo
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS tipo_insumo text;

-- Comentários para documentação
COMMENT ON COLUMN public.produtos.tipo_item IS 'Tipo do item: produto ou insumo';
COMMENT ON COLUMN public.produtos.tipo_insumo IS 'Tipo específico de insumo: caixa, etiqueta_produto, etiqueta_frete, fita_adesiva, papel_bolha, lacre, manual, luvas, outro';