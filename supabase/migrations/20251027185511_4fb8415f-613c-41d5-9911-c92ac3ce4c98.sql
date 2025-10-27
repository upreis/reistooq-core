-- Adicionar campo data_vencimento_acao à tabela reclamacoes
ALTER TABLE public.reclamacoes 
ADD COLUMN IF NOT EXISTS data_vencimento_acao TIMESTAMP WITH TIME ZONE;

-- Comentário descritivo
COMMENT ON COLUMN public.reclamacoes.data_vencimento_acao IS 'Data limite para ação do vendedor (resolution.deadline da API ML)';