-- Adicionar coluna anexos_ml para armazenar anexos/evidências das mensagens do claim
ALTER TABLE public.devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS anexos_ml JSONB DEFAULT '[]'::jsonb;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.devolucoes_avancadas.anexos_ml IS 
'Anexos/evidências enviados nas mensagens do claim (fotos, documentos, etc). Array de objetos com id, url, type, name, size, sender_role (complainant/respondent/mediator), source (buyer/seller/meli), message_id e date_created';

-- Criar índice GIN para queries eficientes em JSONB
CREATE INDEX IF NOT EXISTS idx_devolucoes_anexos_ml 
ON public.devolucoes_avancadas USING GIN (anexos_ml);

-- Comentário no índice
COMMENT ON INDEX idx_devolucoes_anexos_ml IS 
'Índice GIN para queries eficientes em anexos_ml (ex: buscar por tipo de anexo, origem, etc)';