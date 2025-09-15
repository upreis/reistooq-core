-- Ajustar tabela ml_devolucoes_reclamacoes para compatibilidade

-- Tornar claim_id nullable para suportar returns
ALTER TABLE public.ml_devolucoes_reclamacoes 
ALTER COLUMN claim_id DROP NOT NULL;

-- Ajustar campos para flexibilidade
ALTER TABLE public.ml_devolucoes_reclamacoes 
ALTER COLUMN claim_type DROP NOT NULL,
ALTER COLUMN claim_status DROP NOT NULL;

-- Adicionar colunas compatíveis se não existirem
ALTER TABLE public.ml_devolucoes_reclamacoes 
ADD COLUMN IF NOT EXISTS data_criacao timestamp with time zone,
ADD COLUMN IF NOT EXISTS status_devolucao text,
ADD COLUMN IF NOT EXISTS valor_retido numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS produto_titulo text,
ADD COLUMN IF NOT EXISTS quantidade integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS dados_order jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dados_claim jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dados_return jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dados_mensagens jsonb DEFAULT '{}';

-- Comentários para documentação
COMMENT ON COLUMN public.ml_devolucoes_reclamacoes.data_criacao IS 'Data de criação copiada do ML para compatibilidade frontend';
COMMENT ON COLUMN public.ml_devolucoes_reclamacoes.status_devolucao IS 'Status copiado para compatibilidade frontend';
COMMENT ON COLUMN public.ml_devolucoes_reclamacoes.valor_retido IS 'Valor do pedido para cálculos';
COMMENT ON COLUMN public.ml_devolucoes_reclamacoes.produto_titulo IS 'Título do produto para exibição';
COMMENT ON COLUMN public.ml_devolucoes_reclamacoes.dados_order IS 'JSON completo da order do ML';
COMMENT ON COLUMN public.ml_devolucoes_reclamacoes.dados_claim IS 'JSON completo do claim do ML';
COMMENT ON COLUMN public.ml_devolucoes_reclamacoes.dados_return IS 'JSON completo do return do ML';
COMMENT ON COLUMN public.ml_devolucoes_reclamacoes.dados_mensagens IS 'Mensagens do chat quando disponível';