-- Adicionar coluna local_venda_id na tabela de mapeamentos (opcional)
-- Quando preenchido, o sistema usará as composições do local de venda

ALTER TABLE public.mapeamento_locais_estoque 
ADD COLUMN IF NOT EXISTS local_venda_id UUID REFERENCES public.locais_venda(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_mapeamento_local_venda ON public.mapeamento_locais_estoque(local_venda_id);

-- Comentário explicativo
COMMENT ON COLUMN public.mapeamento_locais_estoque.local_venda_id IS 
'Quando preenchido, o sistema usará as composições específicas do local de venda (composicoes_local_venda) ao invés das composições padrão do local de estoque (composicoes_insumos)';
