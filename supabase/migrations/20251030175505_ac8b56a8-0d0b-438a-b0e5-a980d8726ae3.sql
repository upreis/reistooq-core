-- Adicionar colunas faltantes à tabela movimentacoes_estoque
ALTER TABLE public.movimentacoes_estoque 
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS sku_produto TEXT,
ADD COLUMN IF NOT EXISTS nome_produto TEXT,
ADD COLUMN IF NOT EXISTS quantidade NUMERIC,
ADD COLUMN IF NOT EXISTS origem_movimentacao TEXT,
ADD COLUMN IF NOT EXISTS pagina_origem TEXT,
ADD COLUMN IF NOT EXISTS referencia_id UUID,
ADD COLUMN IF NOT EXISTS referencia_tipo TEXT,
ADD COLUMN IF NOT EXISTS usuario_id UUID,
ADD COLUMN IF NOT EXISTS usuario_nome TEXT,
ADD COLUMN IF NOT EXISTS usuario_email TEXT,
ADD COLUMN IF NOT EXISTS metadados JSONB DEFAULT '{}'::jsonb;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_mov_est_org ON public.movimentacoes_estoque(organization_id);
CREATE INDEX IF NOT EXISTS idx_mov_est_sku ON public.movimentacoes_estoque(sku_produto);
CREATE INDEX IF NOT EXISTS idx_mov_est_origem ON public.movimentacoes_estoque(origem_movimentacao);