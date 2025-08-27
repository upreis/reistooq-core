-- Adicionar colunas faltantes para completar o modelo padronizado

-- Básicas
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS origem text;

-- Produtos  
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS skus_produtos text;

-- Financeiras (já existem algumas)
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS metodo_envio_combinado text;
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS modo_envio_combinado text;

-- Mapeamento (já existem algumas)
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS substatus_estado_atual text;

-- Envio
ALTER TABLE public.historico_vendas ADD COLUMN IF NOT EXISTS tipo_entrega text;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_historico_vendas_created_by ON public.historico_vendas(created_by);
CREATE INDEX IF NOT EXISTS idx_historico_vendas_created_at ON public.historico_vendas(created_at);
CREATE INDEX IF NOT EXISTS idx_historico_vendas_data_pedido ON public.historico_vendas(data_pedido);
CREATE INDEX IF NOT EXISTS idx_historico_vendas_origem ON public.historico_vendas(origem);