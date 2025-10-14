-- ✅ ADICIONAR AS 2 COLUNAS FALTANTES DA FASE 2

-- Adicionar coluna metodo_pagamento
ALTER TABLE public.devolucoes_avancadas
ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT;

-- Adicionar coluna valor_parcela
ALTER TABLE public.devolucoes_avancadas
ADD COLUMN IF NOT EXISTS valor_parcela NUMERIC;

-- Adicionar comentários
COMMENT ON COLUMN public.devolucoes_avancadas.metodo_pagamento IS 'Método de pagamento utilizado (ex: account_money, credit_card)';
COMMENT ON COLUMN public.devolucoes_avancadas.valor_parcela IS 'Valor de cada parcela do pagamento';

-- Criar índice para metodo_pagamento (útil para filtros)
CREATE INDEX IF NOT EXISTS idx_devolucoes_metodo_pagamento 
ON public.devolucoes_avancadas(metodo_pagamento);

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ 2 colunas faltantes adicionadas: metodo_pagamento, valor_parcela';
END $$;