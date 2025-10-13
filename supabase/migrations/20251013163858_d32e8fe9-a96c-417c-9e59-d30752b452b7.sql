-- ✅ CRIAR CONSTRAINT ÚNICA PARA UPSERT FUNCIONAR
-- Isso permite que o upsert funcione corretamente ao buscar dados da API

-- Primeiro, remover constraint antiga se existir
ALTER TABLE public.devolucoes_avancadas 
DROP CONSTRAINT IF EXISTS devolucoes_avancadas_order_integration_key;

-- Criar nova constraint única composta
ALTER TABLE public.devolucoes_avancadas 
ADD CONSTRAINT devolucoes_avancadas_order_integration_key 
UNIQUE (order_id, integration_account_id);

-- Criar índice para melhorar performance nas buscas
CREATE INDEX IF NOT EXISTS idx_devolucoes_order_integration 
ON public.devolucoes_avancadas (order_id, integration_account_id);

-- Criar índice para data_criacao (usado em ordenações)
CREATE INDEX IF NOT EXISTS idx_devolucoes_data_criacao 
ON public.devolucoes_avancadas (data_criacao DESC);

-- Criar índice para integration_account_id (usado em filtros)
CREATE INDEX IF NOT EXISTS idx_devolucoes_integration_account 
ON public.devolucoes_avancadas (integration_account_id);

COMMENT ON CONSTRAINT devolucoes_avancadas_order_integration_key 
ON public.devolucoes_avancadas 
IS 'Constraint única composta para permitir upsert de devoluções por order_id e conta ML';