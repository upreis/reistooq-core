-- ✅ ADICIONAR COLUNAS DE TRACKING NUMBER NA TABELA RECLAMACOES
-- Conforme documentação do PDF, adicionar campos de rastreamento

ALTER TABLE public.reclamacoes 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS codigo_rastreamento TEXT,
ADD COLUMN IF NOT EXISTS tracking_method TEXT,
ADD COLUMN IF NOT EXISTS tracking_status TEXT,
ADD COLUMN IF NOT EXISTS tracking_substatus TEXT;

-- Criar índice para buscas por código de rastreamento
CREATE INDEX IF NOT EXISTS idx_reclamacoes_tracking_number 
ON public.reclamacoes(tracking_number);

CREATE INDEX IF NOT EXISTS idx_reclamacoes_codigo_rastreamento 
ON public.reclamacoes(codigo_rastreamento);

-- Comentários explicativos
COMMENT ON COLUMN public.reclamacoes.tracking_number IS 'Número de rastreamento do envio (buscado do endpoint /shipments/{id})';
COMMENT ON COLUMN public.reclamacoes.codigo_rastreamento IS 'Código de rastreamento (compatibilidade, mesmo valor de tracking_number)';
COMMENT ON COLUMN public.reclamacoes.tracking_method IS 'Método/transportadora do rastreamento';
COMMENT ON COLUMN public.reclamacoes.tracking_status IS 'Status do rastreamento';
COMMENT ON COLUMN public.reclamacoes.tracking_substatus IS 'Substatus do rastreamento';