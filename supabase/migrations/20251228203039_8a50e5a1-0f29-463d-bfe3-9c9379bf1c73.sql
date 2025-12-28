-- Adicionar campo por_venda na tabela composicoes_local_venda
-- por_venda = true: quantidade fixa por pedido (1 etiqueta por venda)
-- por_venda = false (padrão): quantidade × qtd vendida (2 produtos = 2 etiquetas)

ALTER TABLE public.composicoes_local_venda
ADD COLUMN por_venda BOOLEAN NOT NULL DEFAULT false;

-- Comentário para documentar
COMMENT ON COLUMN public.composicoes_local_venda.por_venda IS 'Se true, retira quantidade fixa por venda. Se false, multiplica pela quantidade vendida.';