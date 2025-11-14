-- ✅ Adicionar coluna tipo_logistica na tabela devolucoes_avancadas
-- Campo para armazenar o tipo de logística da venda original (self_service, fulfillment, cross_docking, xd_drop_off)

ALTER TABLE public.devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS tipo_logistica TEXT;

-- Criar índice para melhor performance em filtros
CREATE INDEX IF NOT EXISTS idx_devolucoes_avancadas_tipo_logistica 
ON public.devolucoes_avancadas(tipo_logistica);

-- Comentário explicativo
COMMENT ON COLUMN public.devolucoes_avancadas.tipo_logistica IS 'Tipo de logística da venda original (self_service, fulfillment, cross_docking, xd_drop_off, etc.)';