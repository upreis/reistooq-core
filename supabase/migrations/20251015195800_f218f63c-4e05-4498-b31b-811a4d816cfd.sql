-- Adicionar 5 colunas de dados perdidos da API do Mercado Livre
-- Estas colunas capturam informações importantes que não estavam sendo armazenadas

ALTER TABLE public.devolucoes_avancadas
ADD COLUMN IF NOT EXISTS claim_stage text,
ADD COLUMN IF NOT EXISTS claim_quantity_type text,
ADD COLUMN IF NOT EXISTS claim_fulfilled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS return_intermediate_check jsonb,
ADD COLUMN IF NOT EXISTS return_resource_type text;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.devolucoes_avancadas.claim_stage IS 'Estágio do claim no processo (ex: claim_closing, claim_input, dispute)';
COMMENT ON COLUMN public.devolucoes_avancadas.claim_quantity_type IS 'Tipo de quantidade do claim (ex: unit, pack)';
COMMENT ON COLUMN public.devolucoes_avancadas.claim_fulfilled IS 'Se o claim foi cumprido/resolvido';
COMMENT ON COLUMN public.devolucoes_avancadas.return_intermediate_check IS 'Dados da verificação intermediária do return';
COMMENT ON COLUMN public.devolucoes_avancadas.return_resource_type IS 'Tipo de recurso do return (ex: return_to_seller, return_to_buyer)';

-- Criar índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_devolucoes_claim_stage ON public.devolucoes_avancadas(claim_stage);
CREATE INDEX IF NOT EXISTS idx_devolucoes_claim_fulfilled ON public.devolucoes_avancadas(claim_fulfilled);
CREATE INDEX IF NOT EXISTS idx_devolucoes_return_resource_type ON public.devolucoes_avancadas(return_resource_type);