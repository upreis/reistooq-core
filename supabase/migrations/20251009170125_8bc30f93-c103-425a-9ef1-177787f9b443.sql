-- Adicionar coluna para identificar produtos pai
ALTER TABLE public.produtos 
ADD COLUMN eh_produto_pai boolean NOT NULL DEFAULT false;

-- Criar índice para otimizar queries
CREATE INDEX idx_produtos_eh_produto_pai ON public.produtos(eh_produto_pai);

-- Comentário explicativo
COMMENT ON COLUMN public.produtos.eh_produto_pai IS 'Indica se o produto é um produto pai (agrupador) ou filho (variação)';