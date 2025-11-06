
-- ============================================================================
-- ADICIONAR COLUNAS DE LOCAL DE ESTOQUE para reversão correta
-- ============================================================================

-- Adicionar coluna para ID do local de estoque (FK para locais_estoque)
ALTER TABLE public.historico_vendas
ADD COLUMN IF NOT EXISTS local_estoque_id uuid REFERENCES public.locais_estoque(id);

-- Adicionar coluna para nome do local (cache para performance)
ALTER TABLE public.historico_vendas
ADD COLUMN IF NOT EXISTS local_estoque_nome text;

-- Adicionar coluna legado (compatibilidade)
ALTER TABLE public.historico_vendas
ADD COLUMN IF NOT EXISTS local_estoque text;

-- Criar índice para busca eficiente
CREATE INDEX IF NOT EXISTS idx_historico_vendas_local_estoque 
ON public.historico_vendas(local_estoque_id)
WHERE local_estoque_id IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.historico_vendas.local_estoque_id IS 'ID do local de estoque onde foi feita a baixa - necessário para reversão correta';
COMMENT ON COLUMN public.historico_vendas.local_estoque_nome IS 'Nome do local de estoque (cache)';
COMMENT ON COLUMN public.historico_vendas.local_estoque IS 'Nome do local de estoque (legado)';
